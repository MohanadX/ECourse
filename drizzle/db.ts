import { env } from "@/data/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle({
	schema,
	connection: {
		password: env.POSTGRES_PASSWORD,
		user: env.POSTGRES_USER,
		database: env.POSTGRES_DB,
		host: env.POSTGRES_HOST,
	},
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
