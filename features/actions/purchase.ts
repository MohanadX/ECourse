"use server";

import { db } from "@/drizzle/db";
import { stripeServerClient } from "@/StripeServer";
import { updatePurchase } from "../purchases/db/purchase";
import { revokeUserCourseAccess } from "../course/db/CourseAccess";
import { getCurrentUser } from "../users/db/clerk";
import { productPermission } from "./products";
import { PURCHASE_REFUND_WINDOW_MS } from "@/lib/utils";

export async function refundPurchase(purchaseId: string) {
    const { userId, role } = await getCurrentUser();
    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    const purchaseRecord = await db.query.PurchaseTable.findFirst({
        where: (table, { eq }) => eq(table.id, purchaseId),
    });

    if (!purchaseRecord) {
        return { success: false, message: "Purchase record not found" };
    }

    //authorization 
    const isOwner = purchaseRecord.userId === userId;
    const isAdmin = await productPermission(role);
    if (!isOwner && !isAdmin) {
        return { success: false, message: "Unauthorized" };
    }

    //  Prevent duplicate refunds
    if (purchaseRecord.refundedAt != null) {
        return { success: false, message: "This purchase has already been refunded." };
    }

    // Validate the refund policy deadline (e.g., 30 days from purchase)
    const purchaseTime = new Date(purchaseRecord.createdAt).getTime();
    if (Date.now() - purchaseTime > PURCHASE_REFUND_WINDOW_MS) {
        return { success: false, message: "This purchase is outside of the allowable refund window." };
    }

    const secureStripeSessionId = purchaseRecord.stripeSessionId;
    if (!secureStripeSessionId) {
        return {
            success: false,
            message: "No Stripe session associated with this purchase",
        };
    }

    let paymentIntentId: string;
    try {
        const session = await stripeServerClient.checkout.sessions.retrieve(
            secureStripeSessionId,
        );

        const id = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!id) {
            return {
                success: false,
                message: "No valid payment intent found for this session.",
            };
        }
        paymentIntentId = id;
    } catch (stripeError) {
        console.error("Stripe session retrieval failed:", stripeError);
        return {
            success: false,
            message: "Failed to communicate with Stripe to verify payment details.",
        };
    }

    // Execute Refund safely with a stable idempotency key (to prevent API duplicate refund)
    let refund;
    try {
        refund = await stripeServerClient.refunds.create(
            { payment_intent: paymentIntentId },
            { idempotencyKey: `refund-${purchaseId}` } // Prevents double-refund on retries
        );
    } catch (stripeError) {
        console.error("Stripe refund execution failed:", stripeError);
        return {
            success: false,
            message: "Failed to process the refund with Stripe. The payment has not been modified.",
        };
    }

    //  only proceed on guaranteed 'succeeded'
    if (refund.status !== "succeeded") {
        return {
            success: false,
            message: `Refund status is currently: ${refund.status}. Access remains unchanged until settlement.`,
        };
    }

    //  Transaction
    try {
        await db.transaction(async (trx) => {
            const [refundedPurchase] = await Promise.all([
                updatePurchase(purchaseId, { refundedAt: new Date() }, trx),
                revokeUserCourseAccess(
                    {
                        productId: purchaseRecord.productId,
                        userId: purchaseRecord.userId,
                    },
                    trx
                ),
            ]);

            // Throwing automatically triggers trx.rollback()
            if (!refundedPurchase) {
                throw new Error("Local DB record update failed.");
            }
        });

        return { success: true, message: "Successfully refunded purchase" };

    } catch (dbError) {
        console.error("Database transaction failed during refund commit:", dbError);
        return {
            success: false,
            // Critical alert condition: Stripe processed the refund, but local record-sync failed.
            message: "Refund was successful via Stripe, but access revocation failed to register locally. Please contact system admin.",
        };
    }
}