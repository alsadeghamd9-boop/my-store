import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { loginAttempts } from "@/db/schema";
import { sha256 } from "@/lib/auth";

/** Atomic, database-backed limits work across Vercel instances and cold starts. */
export async function loginRateLimit(identifier: string, limit: number, minutes: number) {
  const key = sha256(identifier);
  const result = await getDb().execute(sql`
    INSERT INTO login_attempts (key, attempts, expires_at)
    VALUES (${key}, 1, now() + ${minutes} * interval '1 minute')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN login_attempts.expires_at <= now() THEN 1 ELSE login_attempts.attempts + 1 END,
      expires_at = CASE WHEN login_attempts.expires_at <= now() THEN now() + ${minutes} * interval '1 minute' ELSE login_attempts.expires_at END
    RETURNING attempts
  `);
  if (Math.random() < 0.01) await getDb().execute(sql`DELETE FROM login_attempts WHERE expires_at < now()`);
  return Number(result.rows[0]?.attempts) <= limit;
}

export async function clearLoginRateLimit(identifier: string) {
  await getDb().delete(loginAttempts).where(eq(loginAttempts.key, sha256(identifier)));
}
