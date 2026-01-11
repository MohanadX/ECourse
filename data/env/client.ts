import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
			.string({ error: "Clerk Public ENV is not available" })
			.min(1),
		NEXT_PUBLIC_CLERK_SIGN_IN_URL: z
			.string({
				error: "Clerk Public Sign In URL ENV is not available",
			})
			.min(1),
		NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z
			.string({
				error: "Clerk Public Sign Up URL ENV is not available",
			})
			.optional(),
		NEXT_PUBLIC_IMAGEKIT_ID: z
			.string()
			.min(1, { error: "Image Kit id is not set correctly" }),
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
			.string()
			.min(1, { error: "Stripe public key is not set correctly" }),
		NEXT_PUBLIC_SERVER_URL: z
			.string()
			.url({ message: "Server URL must be a valid URL" }),
	},
	experimental__runtimeEnv: {
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
			process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
		NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
		NEXT_PUBLIC_IMAGEKIT_ID: process.env.NEXT_PUBLIC_IMAGEKIT_ID,
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
	},
});
