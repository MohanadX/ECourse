import { env } from "@/data/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

import { Pool } from "pg";

const isProd = process.env.NODE_ENV === "production";

export const client = new Pool(
	isProd
		? {
				connectionString: env.DATABASE_URL,
				ssl: true,
			}
		: {
				host: env.POSTGRES_HOST,
				user: env.POSTGRES_USER,
				password: env.POSTGRES_PASSWORD,
				database: env.POSTGRES_DB,
			},
);

export const db = drizzle({
	schema,
	client,
});

/*
schema benefits: Autocomplete works

Selecting wrong columns errors at compile time

JOINs are typed

Insert/update values are validated

This is one of Drizzle’s biggest advantages.
This file does not create your tables in PostgreSQL.
Migrations handle database creation / schema updates
*/
