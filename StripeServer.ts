import { Stripe } from "stripe";
import { env } from "./data/env/server";

export const stripeServerClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-12-15.clover", // to unify api version not use account version (which update by auto)
});
