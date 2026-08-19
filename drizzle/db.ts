import { env } from "@/data/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";

const isProd = process.env.NODE_ENV === "production";
const isVercel = Boolean(process.env.VERCEL);

// Global object type declaration for Next.js singleton pattern
const globalForDb = globalThis as unknown as { pool: Pool };

// Pool Configuration tuned for high concurrency load testing
export const client =
  globalForDb.pool ||
  new Pool({
    ...(isProd
      ? {
          connectionString: env.DATABASE_URL,
          ssl: true,
        }
      : {
          host: env.POSTGRES_HOST,
          user: env.POSTGRES_USER,
          password: env.POSTGRES_PASSWORD,
          database: env.POSTGRES_DB,
        }),

    // • Vercel Serverless: max 2 connections so scaled Lambdas don't swarm Neon
    max: isVercel ? 2 : 50,
    min: isVercel ? 0 : 2, // Keep 5 warm connections ready
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Fail fast after 5s instead of hanging for 60s
  });

// Prevent multiple pool instances during Next.js fast-refresh / module re-evaluations
if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = client;
}

export const db = drizzle({
  schema,
  client,
});
