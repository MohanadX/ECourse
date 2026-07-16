import { env } from "@/data/env/server";
import { db } from "@/drizzle/db";
import { ProductTable, PurchaseTable, UserTable } from "@/drizzle/schema";
import { addUserCourseAccess, revokeUserCourseAccess } from "@/features/course/db/CourseAccess";
import { insertPurchase, updatePurchase } from "@/features/purchases/db/purchase";
import { stripeServerClient } from "@/StripeServer";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
	const stripeSessionId = req.nextUrl.searchParams.get("stripeSessionId");
	if (!stripeSessionId) redirect("/product/purchase-failure");

	let redirectUrl: string;

	try {
		const checkoutSession = await stripeServerClient.checkout.sessions.retrieve(
			stripeSessionId,
			{
				expand: ["line_items"],
			}
		);
		const [productId, productSlug] = await processStripeCheckout(
			checkoutSession
		);

		redirectUrl = `/product/${productId}/${productSlug}/purchase/success`;
	} catch {
		redirectUrl = `/product/purchase-failure`;
	}

	return NextResponse.redirect(new URL(redirectUrl, req.url));
	/*
    req.url = "https://example.com/api/checkout";
    redirectUrl = "/success";
    new URL(redirectUrl, req.url).toString();
// "https://example.com/success"
    */
}

export async function POST(req: NextRequest) {
	let event: Stripe.Event;
	try {
		event = stripeServerClient.webhooks.constructEvent(
			await req.text(),
			req.headers.get("stripe-signature") as string,
			env.STRIPE_WEBHOOK_SECRET
		);
	} catch (error) {
		console.error("Webhook signature verification failed:", error);
		return new Response("Invalid signature", { status: 400 });
	}

	switch (event.type) {
        
        // PROCESS NEW PURCHASES
        
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            try {
                await processStripeCheckout(event.data.object as Stripe.Checkout.Session);
            } catch (error) {
                console.error("Failed to process checkout webhook:", {
                    eventId: event.id,
                    sessionId: event.data.object.id,
                    error,
                });
                return new Response("Processing failed", { status: 500 }); // Retries
            }
            break;
        }
        
        //  RECONCILE REFUNDS
        case "charge.refunded": {
            try {
                await processStripeRefund(event.data.object as Stripe.Charge);
            } catch (error) {
                console.error("Failed to process refund webhook reconciliation:", {
                    eventId: event.id,
                    chargeId: event.data.object.id,
                    error,
                });
                return new Response("Processing failed", { status: 500 }); // Retries
            }
            break;
        }
    }

    return new Response(null, { status: 200 });
}

async function processStripeCheckout(checkoutSession: Stripe.Checkout.Session) {
	const userId = checkoutSession.metadata?.userId; // something we provided with checkout session Id
	const productId = checkoutSession.metadata?.productId;

	if (!userId || !productId) {
		throw new Error("Missing metadata");
	}

	// Verify payment was successful
	if (checkoutSession.payment_status !== "paid") {
		throw new Error(
			`Payment not completed. Status: ${checkoutSession.payment_status}`
		);
	}

	const [product, user] = await Promise.all([
		getProduct(productId),
		getUser(userId),
	]);

	if (!product) throw new Error("Product is not found");
	if (!user) throw new Error("User is not found");

	const courseIds = product.CourseProducts.map((cp) => cp.courseId);

	await db.transaction(async (trx) => {
		await addUserCourseAccess({ userId: user.id, courseIds }, trx);
		await insertPurchase(
			{
				stripeSessionId: checkoutSession.id,
				pricePaidInCents:
					checkoutSession.amount_total ?? product.priceInDollars * 100,
				productDetails: product,
				userId: user.id,
				productId: product.id,
				adminId: product.userId,
			},
			trx
		);
	});

	return [product.id, product.slug];
}

async function processStripeRefund(charge: Stripe.Charge) {
    // refund list associated with this charge to extract metadata
    const refundsList = await stripeServerClient.refunds.list({
        charge: charge.id,
        limit: 1,
    });

    const latestRefund = refundsList.data[0];
    const purchaseId = latestRefund?.metadata?.purchaseId;

    if (!purchaseId) {
        console.warn(`No purchaseId metadata found in refund for charge: ${charge.id}`);
        return; 
    }

    // current record
    const purchaseRecord = await db.query.PurchaseTable.findFirst({
        where: eq(PurchaseTable.id, purchaseId),
    });

    if (!purchaseRecord) {
        throw new Error(`Refund reconciliation failed: Purchase record ${purchaseId} not found`);
    }

    // Only run database updates if the local record doesn't show "refundedAt" yet.
    // we bypass this, preventing redundant db writes.
    if (purchaseRecord.refundedAt == null) {
        await db.transaction(async (trx) => {
            await updatePurchase(purchaseId, { refundedAt: new Date() }, trx);
            await revokeUserCourseAccess(
                {
                    productId: purchaseRecord.productId,
                    userId: purchaseRecord.userId,
                },
                trx
            );
        });
        console.log(`Reconciled and revoked access successfully for purchase: ${purchaseId}`);
    }
}

async function getProduct(productId: string) {
	return db.query.ProductTable.findFirst({
		columns: {
			id: true,
			slug: true,
			priceInDollars: true,
			name: true,
			description: true,
			imageUrl: true,
			userId: true,
		},
		where: eq(ProductTable.id, productId),
		with: {
			CourseProducts: {
				columns: {
					courseId: true,
				},
			},
		},
	});
}

async function getUser(userId: string) {
	return db.query.UserTable.findFirst({
		columns: {
			id: true,
		},
		where: eq(UserTable.id, userId),
	});
}
