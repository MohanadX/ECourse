import { loadStripe } from "@stripe/stripe-js";
import { env } from "./data/env/client";

export const stripeClientPromise = loadStripe(
	env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);
