import { env } from "@/data/env/server";
import { db } from "@/drizzle/db";
import { ProductTable, UserTable } from "@/drizzle/schema";
import { addUserCourseAccess } from "@/features/course/db/CourseAccess";
import { insertPurchase } from "@/features/purchases/db/purchase";
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
	const event = stripeServerClient.webhooks.constructEvent(
		await req.text(),
		req.headers.get("stripe-signature") as string,
		env.STRIPE_WEBHOOK_SECRET
	);

	switch (event.type) {
		case "checkout.session.completed":
		case "checkout.session.async_payment_succeeded": {
			try {
				await processStripeCheckout(event.data.object);
			} catch {
				return new Response(null, { status: 500 });
			}
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
	if (checkoutSession.payment_status !== 'paid') {
		throw new Error(`Payment not completed. Status: ${checkoutSession.payment_status}`);
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
				pricePaidInCents: checkoutSession.amount_total ?? product.priceInDollars * 100,
				productDetails: product,
				userId: user.id,
				productId: product.id,
			},
			trx
		);
	});

	return [product.id, product.slug];
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
