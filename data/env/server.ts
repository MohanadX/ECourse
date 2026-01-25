import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
	server: {
		// POSTGRES_PASSWORD: z
		// 	.string({ error: "DB Password is not set correctly" })
		// 	.min(1),
		// POSTGRES_USER: z.string({ error: "DB User is not set correctly" }).min(1),
		// POSTGRES_HOST: z.string({ error: "DB Host is not set correctly" }).min(1),
		// POSTGRES_DB: z.string({ error: "DB URL is not set correctly" }).min(1),
		CLERK_WEBHOOK_SECRET: z.string().min(1),
		IMAGEKIT_PUBLIC_KEY: z
			.string()
			.min(1, { error: "Image Kit public key is not set correctly" }),
		IMAGEKIT_PRIVATE_KEY: z
			.string()
			.min(1, { error: "Image Kit private key is not set correctly" }),
		IMAGEKIT_URL_ENDPOINT: z
			.string()
			.min(1, { error: "Image Kit url endpoint is not set correctly" }),
		ARCJET_KEY: z.string().min(1, { error: "Arcjet key is not set correctly" }),
		TEST_IP: z.string().min(1).optional(),
		STRIPE_PPP_50_COUPON_ID: z
			.string()
			.min(1, { error: "STRIPE_PPP_50_COUPON_ID is not set correctly" }),
		STRIPE_PPP_40_COUPON_ID: z
			.string()
			.min(1, { error: "STRIPE_PPP_40_COUPON_ID is not set correctly" }),
		STRIPE_PPP_30_COUPON_ID: z
			.string()
			.min(1, { error: "STRIPE_PPP_30_COUPON_ID is not set correctly" }),
		STRIPE_PPP_20_COUPON_ID: z
			.string()
			.min(1, { error: "STRIPE_PPP_20_COUPON_ID is not set correctly" }),
		STRIPE_SECRET_KEY: z
			.string()
			.min(1, { error: "Stripe Secret key is not set correctly" }),
		STRIPE_WEBHOOK_SECRET: z
			.string()
			.min(1, { error: "Stripe Webhook secret is not set correctly" }),
		SERVER_URL: z.string().url({ message: "Server URL must be a valid URL" }),
		DATABASE_URL: z
			.string()
			.min(1, { error: "Database Url is not set correctly" }),
		RATE_LIMIT_INTERVAL: z
			.string()
			.min(1, { error: "RATE limit interval is not set correctly" }),
		RATE_LIMIT_MAX: z
			.string()
			.min(1, { error: "RATE limit max is not set correctly" }),
	},
	experimental__runtimeEnv: process.env,
});
