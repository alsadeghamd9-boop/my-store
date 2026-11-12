import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Do not read DATABASE_URL, construct a pool, or connect during module import.
// Next.js can therefore collect routes and build without database credentials.
type Database = ReturnType<typeof drizzle>;
const globalForDb = globalThis as typeof globalThis & {
  __souqDb?: Database;
};

export function getDb(): Database {
  if (!globalForDb.__souqDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required at runtime");
    }
    const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 20_000 });
    globalForDb.__souqDb = drizzle(pool);
  }
  return globalForDb.__souqDb;
}
