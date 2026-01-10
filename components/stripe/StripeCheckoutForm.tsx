"use client";

import { getClientSessionSecret } from "@/features/actions/stripe";
import { stripeClientPromise } from "@/StripeClient";
import {
	EmbeddedCheckoutProvider,
	EmbeddedCheckout,
} from "@stripe/react-stripe-js";

export default function StripeCheckoutForm({
	product,
	user,
}: {
	product: {
		priceInDollars: number;
		id: string;
		name: string;
		description: string;
		imageUrl: string;
	};
	user: {
		email: string;
		id: string;
	};
}) {
	return (
		<EmbeddedCheckoutProvider
			stripe={stripeClientPromise}
			options={{
				fetchClientSecret: getClientSessionSecret.bind(null, product, user),
			}}
		>
			<EmbeddedCheckout></EmbeddedCheckout>
		</EmbeddedCheckoutProvider>
	);
}
