import { defineConfig } from "drizzle-kit";
import { env } from "./data/env/server";

export default defineConfig({
	out: "./drizzle/migrations",
	schema: "./drizzle/schema",
	dialect: "postgresql",
	strict: true,
	verbose: true,
	dbCredentials: {
		password: env.POSTGRES_PASSWORD,
		user: env.POSTGRES_USER,
		host: env.POSTGRES_HOST,
		database: env.POSTGRES_DB,
		ssl: false,
	},
});
