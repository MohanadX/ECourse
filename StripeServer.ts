import { Stripe } from "stripe";
import { env } from "./data/env/server";

export const stripeServerClient = new Stripe(env.STRIPE_SECRET_KEY);
