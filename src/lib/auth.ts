import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { cartItems, sessions, users, wishlistItems } from "@/db/schema";
import { newToken } from "@/lib/password";

export const SESSION_COOKIE = "souq_sid";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 90,
};

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  role: string;
}

export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Route handlers only: guarantees a session row + cookie exists (guest or user). */
export async function ensureSession(): Promise<{ id: string; userId: number | null }> {
  await ensureBootstrap();
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;

  if (existing) {
    const rows = await db
      .select({ id: sessions.id, userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.id, existing))
      .limit(1);
    if (rows.length > 0) return { id: rows[0].id, userId: rows[0].userId };
  }

  const token = newToken();
  await db.insert(sessions).values({ id: token });
  store.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
  return { id: token, userId: null };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionId = await readSessionId();
  if (!sessionId) return null;
  try {
    await ensureBootstrap();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        city: users.city,
        address: users.address,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sessionId))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

/** Creates an authenticated session and merges the guest cart/wishlist into it. */
export async function signInSession(userId: number): Promise<string> {
  await ensureBootstrap();
  const store = await cookies();
  const guestId = store.get(SESSION_COOKIE)?.value;
  const token = newToken();
  await db.insert(sessions).values({ id: token, userId });

  if (guestId && guestId !== token) {
    const guestCart = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, guestId));

    for (const item of guestCart) {
      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(eq(cartItems.sessionId, token), eq(cartItems.productId, item.productId)),
        )
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + item.quantity })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await db
          .insert(cartItems)
          .values({ sessionId: token, productId: item.productId, quantity: item.quantity });
      }
    }

    await db.execute(sql`
      insert into wishlist_items (session_id, product_id)
      select ${token}, product_id from wishlist_items where session_id = ${guestId}
      on conflict on constraint wishlist_session_product_uq do nothing
    `);

    await db.delete(sessions).where(eq(sessions.id, guestId));
  }

  store.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
  return token;
}

export async function signOutSession(): Promise<void> {
  const sessionId = await readSessionId();
  const store = await cookies();
  if (sessionId) {
    // Removes the session (and its guest cart rows) so no orphan data is left behind.
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  store.delete(SESSION_COOKIE);
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}
