import { env } from "@/data/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

import { Pool } from "pg";

const client = new Pool({
	connectionString: env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: true,
	},
});

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
