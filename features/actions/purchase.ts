"use server";

import { db } from "@/drizzle/db";
import { stripeServerClient } from "@/StripeServer";
import { updatePurchase } from "../purchases/db/purchase";
import { revokeUserCourseAccess } from "../course/db/CourseAccess";
import { getCurrentUser } from "../users/db/clerk";
import { productPermission } from "./products";

export async function refundPurchase(purchaseId: string) {
    const { userId, role } = await getCurrentUser();
    if (!userId || !(await productPermission(role))) {
        return {
            success: false,
            message: "Unauthorized",
        };
    }

    const purchaseRecord = await db.query.PurchaseTable.findFirst({
        where: (table, { eq }) => eq(table.id, purchaseId),
    });

    if (!purchaseRecord) {
        return {
            success: false,
            message: "Purchase record not found",
        };
    }

    const secureStripeSessionId = purchaseRecord.stripeSessionId;
    if (!secureStripeSessionId) {
        return {
            success: false,
            message: "No Stripe session associated with this purchase",
        };
    }

    try {
        const session = await stripeServerClient.checkout.sessions.retrieve(
            secureStripeSessionId,
        );

        const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
            return {
                success: false,
                message: "No valid payment intent found for this session.",
            };
        }

        // This ensures if Stripe is offline or rejects the refund, nothing gets mutated locally.
        const refund = await stripeServerClient.refunds.create({
            payment_intent: paymentIntentId,
        });

        // Fail-safe check: Stripe refund must be in a successful or pending state.
        // If it fails, we abort here and do not update the database.
        if (refund.status === "failed") {
            return {
                success: false,
                message: "Stripe rejected the refund request. Please try again.",
            };
        }

    } catch (stripeError) {
        console.error("Stripe refund execution failed:", stripeError);
        return {
            success: false,
            message: "Failed to process the refund with Stripe. The payment has not been modified.",
        };
    }

    const dataProcess = await db.transaction(async (trx) => {
        try {
            const [refundedPurchase] = await Promise.all([
				await updatePurchase(
                purchaseId,
                {
                    refundedAt: new Date(),
                },
                trx,
				),
				revokeUserCourseAccess(
                {
                    productId: purchaseRecord.productId,
                    userId: purchaseRecord.userId,
                },
                trx,
            )
			])

            if (!refundedPurchase) {
                trx.rollback();
                return {
                    success: false,
                    message: "Refund succeeded on Stripe but failed to update local purchase database record.",
                };
            }

        } catch (dbError) {
            console.error("Database transaction failed during refund commit:", dbError);
            trx.rollback();
            return {
                success: false,
                // Critical alert condition: money was refunded but local records failed to capture it.
                message: "Refund was successful via Stripe, but access revocation failed to register locally. Please contact system admin.",
            };
        }
    });

    return (
        dataProcess ?? { success: true, message: "Successfully refunded purchase" }
    );
}