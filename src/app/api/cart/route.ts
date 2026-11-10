import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { cartItems, products } from "@/db/schema";
import { ensureSession } from "@/lib/auth";
import { computeTotals, getCart } from "@/db/queries";
import { fail, ok, readJson, toNumber, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { id: sessionId } = await ensureSession();
  const cart = await getCart(sessionId);
  const promo = new URL(req.url).searchParams.get("promo");
  return ok({ ...cart, totals: computeTotals(cart.subtotal, promo) });
}

export async function POST(req: Request) {
  await ensureBootstrap();
  const { id: sessionId } = await ensureSession();
  const body = await readJson(req);
  const productId = toNumber(body.productId);
  const quantity = Math.max(1, Math.min(99, toNumber(body.quantity) ?? 1));

  if (!productId) return fail("معرف المنتج مطلوب");

  const [product] = await db
    .select({ id: products.id, stock: products.stock })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) return fail("المنتج غير موجود", 404);
  if (product.stock <= 0) return fail("المنتج غير متوفر حاليًا", 409);

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)))
    .limit(1);

  const nextQuantity = Math.min(product.stock, (existing[0]?.quantity ?? 0) + quantity);

  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({ quantity: nextQuantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ sessionId, productId, quantity: nextQuantity });
  }

  const cart = await getCart(sessionId);
  return ok({ ...cart, totals: computeTotals(cart.subtotal) });
}

export async function PATCH(req: Request) {
  await ensureBootstrap();
  const { id: sessionId } = await ensureSession();
  const body = await readJson(req);
  const productId = toNumber(body.productId);
  const quantity = toNumber(body.quantity);

  if (!productId || quantity === undefined) return fail("بيانات غير مكتملة");

  if (quantity <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity: Math.min(99, Math.round(quantity)), updatedAt: new Date() })
      .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)));
  }

  const cart = await getCart(sessionId);
  return ok({ ...cart, totals: computeTotals(cart.subtotal) });
}

export async function DELETE(req: Request) {
  await ensureBootstrap();
  const { id: sessionId } = await ensureSession();
  const url = new URL(req.url);
  const productId = toNumber(url.searchParams.get("productId"));

  if (productId) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.productId, productId)));
  } else {
    await db.execute(sql`delete from cart_items where session_id = ${sessionId}`);
  }

  const cart = await getCart(sessionId);
  return ok({ ...cart, totals: computeTotals(cart.subtotal) });
}
