"use client";

import { getClientSessionSecret } from "@/features/actions/stripe";
import { stripeClientPromise } from "@/StripeClient";
import {
	EmbeddedCheckoutProvider,
	EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { useState } from "react";

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
	const [error, setError] = useState<string | null>(null);
	const { theme } = useTheme();

	const fetchClientSecret = async () => {
		try {
			return await getClientSessionSecret(product, user);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Payment initialization failed",
			);
			throw err; // Re-throw so Stripe can handle it
		}
	};

	if (error) {
		return (
			<div className="text-center p-8">
				<h2 className="text-xl font-semibold text-red-600 mb-4">
					Payment Error
				</h2>
				<p className="text-gray-600 mb-4">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-blue-400 text-white rounded"
				>
					Try Again
				</button>
			</div>
		);
	}

	return (
		<EmbeddedCheckoutProvider
			stripe={stripeClientPromise}
			options={{
				fetchClientSecret,
			}}
		>
			<EmbeddedCheckout />
		</EmbeddedCheckoutProvider>
	);
}
