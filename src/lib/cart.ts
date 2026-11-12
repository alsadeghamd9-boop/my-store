import { randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cartItems, products } from "@/db/schema";
import { CART_COOKIE, cookieOptions, getCurrentUser } from "@/lib/auth";
import { MAX_QTY, shippingFor } from "@/lib/constants";
import { ensureSeeded } from "@/lib/seed";

export type CartLine = {
  productId: number;
  slug: string;
  title: string;
  brand: string;
  image: string;
  price: number;
  listPrice: number | null;
  stock: number;
  express: boolean;
  quantity: number;
  /** Product still sold and in stock. */
  available: boolean;
  /** Requested quantity is larger than what is left. */
  exceeds: boolean;
  lineTotal: number;
};

export type Cart = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  hasIssues: boolean;
};

const EMPTY: Cart = { lines: [], count: 0, subtotal: 0, shipping: 0, total: 0, hasIssues: false };

/** Read-only: safe to call from server components. */
export async function getOwnerKey(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) return `u:${user.id}`;
  const guest = (await cookies()).get(CART_COOKIE)?.value;
  return guest && /^[a-f0-9]{32}$/.test(guest) ? `g:${guest}` : null;
}

/** Creates a guest cart cookie when needed. Route handlers only. */
export async function ensureOwnerKey(): Promise<string> {
  const existing = await getOwnerKey();
  if (existing) return existing;
  const token = randomBytes(16).toString("hex");
  (await cookies()).set(CART_COOKIE, token, await cookieOptions(30));
  return `g:${token}`;
}

export const getCart = cache(async (): Promise<Cart> => {
  const key = await getOwnerKey();
  if (!key) return EMPTY;
  await ensureSeeded();
  const rows = await getDb().select({
      productId: products.id,
      slug: products.slug,
      title: products.title,
      brand: products.brand,
      images: products.images,
      price: products.price,
      listPrice: products.listPrice,
      stock: products.stock,
      express: products.express,
      active: products.active,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.ownerKey, key))
    .orderBy(asc(cartItems.id));

  let count = 0;
  let subtotal = 0;
  let hasIssues = false;
  const lines: CartLine[] = rows.map((r) => {
    const available = r.active && r.stock > 0;
    const exceeds = available && r.quantity > r.stock;
    const effective = available ? Math.min(r.quantity, r.stock) : 0;
    const lineTotal = effective * r.price;
    count += effective;
    subtotal += lineTotal;
    if (!available || exceeds) hasIssues = true;
    return {
      productId: r.productId,
      slug: r.slug,
      title: r.title,
      brand: r.brand,
      image: r.images[0] ?? "",
      price: r.price,
      listPrice: r.listPrice,
      stock: r.stock,
      express: r.express,
      quantity: r.quantity,
      available,
      exceeds,
      lineTotal,
    };
  });
  const shipping = shippingFor(subtotal);
  return { lines, count, subtotal, shipping, total: subtotal + shipping, hasIssues };
});

/** After sign-in, fold the guest cart into the account cart. */
export async function mergeGuestCart(userId: number) {
  const jar = await cookies();
  const guest = jar.get(CART_COOKIE)?.value;
  if (!guest || !/^[a-f0-9]{32}$/.test(guest)) return;
  const guestKey = `g:${guest}`;
  const userKey = `u:${userId}`;
  await getDb().execute(sql`
    insert into cart_items (owner_key, product_id, quantity)
    select ${userKey}, product_id, quantity from cart_items where owner_key = ${guestKey}
    on conflict (owner_key, product_id)
    do update set quantity = least(cart_items.quantity + excluded.quantity, ${MAX_QTY})
  `);
  await getDb().delete(cartItems).where(eq(cartItems.ownerKey, guestKey));
  jar.set(CART_COOKIE, "", await cookieOptions(0));
}
