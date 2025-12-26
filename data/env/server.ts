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
	},
	experimental__runtimeEnv: process.env,
});
