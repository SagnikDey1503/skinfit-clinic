/**
 * Neon + Drizzle client. Used by Next.js API routes and by CLI (seed, drizzle-kit).
 * For Next, import `db` from `@/src/db` (that entry adds `server-only`).
 */
import { config as loadEnvFile } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL?.trim()) {
  const root = process.cwd();
  for (const name of [".env.local", ".env"] as const) {
    const p = resolve(root, name);
    if (existsSync(p)) loadEnvFile({ path: p });
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local or .env in the repo root."
  );
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
