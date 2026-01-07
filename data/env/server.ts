import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
	server: {
		POSTGRES_PASSWORD: z
			.string({ error: "DB Password is not set correctly" })
			.min(1),
		POSTGRES_USER: z.string({ error: "DB User is not set correctly" }).min(1),
		POSTGRES_HOST: z.string({ error: "DB Host is not set correctly" }).min(1),
		POSTGRES_DB: z.string({ error: "DB URL is not set correctly" }).min(1),
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
	},
	experimental__runtimeEnv: process.env,
});
