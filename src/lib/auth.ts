import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, gt, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { getAdminConfig } from "@/lib/admin-config";
import { ensureSeeded } from "@/lib/seed";

export { hashPassword, verifyPassword } from "@/lib/password";
export const SESSION_COOKIE = "souq_session";
export const CART_COOKIE = "souq_cart";
const SESSION_DAYS = 30;
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function cookieOptions(maxAgeDays: number) {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const origin = h.get("origin") ?? h.get("referer") ?? "";
  const https = proto === "https" || origin.startsWith("https://");
  return {
    httpOnly: true,
    path: "/",
    maxAge: Math.round(maxAgeDays * 86400),
    // Partitioned secure cookies keep sessions working inside an embedded preview.
    // Mutating endpoints also enforce same-origin requests.
    sameSite: https ? ("none" as const) : ("lax" as const),
    secure: https,
    partitioned: https,
  };
}
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await getDb().insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, await cookieOptions(SESSION_DAYS));
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  jar.set(SESSION_COOKIE, "", await cookieOptions(0));
}
export async function revokeOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await getDb().delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, token ? sha256(token) : "")));
}
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await ensureSeeded();
  const [user] = await getDb().select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  if (!user) return null;
  // No account can retain admin privileges when environment credentials are
  // missing, invalid or belong to a different user.
  const admin = getAdminConfig();
  if (user.role === "admin" && (!admin || user.email.toLowerCase() !== admin.email)) {
    return { ...user, role: "customer" };
  }
  return user;
});
export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export function safeNext(value: unknown, fallback = "/") {
  // Browsers strip tabs/newlines during URL parsing; e.g. "/\t/evil.test"
  // would otherwise become a protocol-relative external URL after validation.
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
