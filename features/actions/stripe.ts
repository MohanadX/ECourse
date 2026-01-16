"use server";

import { env } from "@/data/env/server";
import { getUserCoupon } from "@/lib/pppFunctions";
import { stripeServerClient } from "@/StripeServer";

export async function getClientSessionSecret(
	product: {
		priceInDollars: number;
		id: string;
		name: string;
		description: string;
		imageUrl: string;
	},
	user: {
		email: string;
		id: string;
	}
) {
	try {
		const coupon = await getUserCoupon();
		const discounts = coupon ? [{ coupon: coupon.stripeCouponId }] : undefined;

		const session = await stripeServerClient.checkout.sessions.create({
			line_items: [
				{
					quantity: 1,
					price_data: {
						currency: "usd",
						product_data: {
							name: product.name,
							images: [
								// new URL(product.imageUrl, env.NEXT_PUBLIC_SERVER_URL).href //(for public folder images guarantee absolute url)
								product.imageUrl,
							],
							description: product.description,
						},
						unit_amount: product.priceInDollars * 100, // pennies
					},
				},
			],
			ui_mode: "embedded",
			mode: "payment",
			return_url: `${env.SERVER_URL}/api/webhooks/stripe?stripeSessionId={CHECKOUT_SESSION_ID}`,
			customer_email: user.email,
			payment_intent_data: {
				receipt_email: user.email,
			},
			discounts,
			metadata: {
				productId: product.id,
				userId: user.id,
			},
		});

		if (!session.client_secret) throw new Error("Client secret is null");

		return session.client_secret;
	} catch (error) {
		console.error("Failed to create Stripe checkout session:", error);
		throw new Error("Unable to initialize payment. Please try again.");
	}
}
