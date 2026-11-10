import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, gt, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export { hashPassword, verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "qafila_session";
export const CART_COOKIE = "qafila_cart";
const SESSION_DAYS = 30;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Cookie attributes adapt to how the store is served: over HTTPS (including
 * inside an embedded preview frame) cookies must be SameSite=None + Secure to
 * be accepted; over plain HTTP we fall back to Lax.
 */
export async function cookieOptions(maxAgeDays: number) {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const origin = h.get("origin") ?? h.get("referer") ?? "";
  const https = proto === "https" || origin.startsWith("https://");
  return {
    httpOnly: true,
    path: "/",
    maxAge: Math.round(maxAgeDays * 86400),
    sameSite: https ? ("none" as const) : ("lax" as const),
    secure: https,
    partitioned: https,
  };
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  // Only a hash of the token is stored, so a database leak cannot be replayed.
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, await cookieOptions(SESSION_DAYS));
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.set(SESSION_COOKIE, "", await cookieOptions(0));
}

/** After a password change, sign out every other device. */
export async function revokeOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const keep = token ? sha256(token) : "";
  await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, keep)));
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureSeeded();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
