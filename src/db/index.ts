import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schema";

// This creates the actual connection using your .env secret
const sql = neon(process.env.DATABASE_URL!);

// This exports the 'db' object that your dashboard is looking for
export const db = drizzle(sql, { schema });