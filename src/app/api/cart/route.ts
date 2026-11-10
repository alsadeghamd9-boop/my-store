import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { ensureOwnerKey, getOwnerKey } from "@/lib/cart";
import { MAX_QTY } from "@/lib/constants";

async function countFor(key: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.ownerKey, key));
  return n;
}

async function findProduct(productId: number) {
  const [p] = await db
    .select({ id: products.id, stock: products.stock, active: products.active })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return p;
}

/** Add to cart (increments the existing quantity). */
export async function POST(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  if (!body || !productId) return fail(BAD_REQUEST);
  const add = Math.max(1, Math.min(MAX_QTY, int(body.quantity) ?? 1));

  const product = await findProduct(productId);
  if (!product || !product.active) return fail("هذا المنتج لم يعد متوفراً.", 404);
  if (product.stock <= 0) return fail("عذراً، نفدت الكمية من هذا المنتج.", 409);

  const key = await ensureOwnerKey();
  const [existing] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.ownerKey, key), eq(cartItems.productId, productId)))
    .limit(1);

  const cap = Math.min(product.stock, MAX_QTY);
  const current = existing?.quantity ?? 0;
  const next = Math.min(current + add, cap);
  if (next <= current) {
    return fail(
      product.stock < MAX_QTY
        ? `المتاح من هذا المنتج ${product.stock} فقط، وهي موجودة في سلتك.`
        : `الحد الأقصى ${MAX_QTY} قطع من المنتج الواحد في الطلب.`,
      409,
    );
  }

  await db
    .insert(cartItems)
    .values({ ownerKey: key, productId, quantity: next })
    .onConflictDoUpdate({
      target: [cartItems.ownerKey, cartItems.productId],
      set: { quantity: next },
    });

  return ok({ count: await countFor(key), quantity: next, capped: next < current + add });
}

/** Set an exact quantity for a line. */
export async function PATCH(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  const quantity = body ? int(body.quantity) : null;
  if (!body || !productId || quantity == null) return fail(BAD_REQUEST);

  const key = await getOwnerKey();
  if (!key) return fail("سلتك فارغة.", 404);
  const line = and(eq(cartItems.ownerKey, key), eq(cartItems.productId, productId));

  if (quantity <= 0) {
    await db.delete(cartItems).where(line);
    return ok({ count: await countFor(key), quantity: 0 });
  }

  const product = await findProduct(productId);
  if (!product || !product.active || product.stock <= 0) {
    return fail("هذا المنتج غير متوفر حالياً. أزله من السلة للمتابعة.", 409);
  }
  const next = Math.min(quantity, product.stock, MAX_QTY);
  await db.update(cartItems).set({ quantity: next }).where(line);
  return ok({ count: await countFor(key), quantity: next, capped: next < quantity });
}

/** Remove a line. */
export async function DELETE(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  if (!body || !productId) return fail(BAD_REQUEST);

  const key = await getOwnerKey();
  if (!key) return ok({ count: 0 });
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.ownerKey, key), eq(cartItems.productId, productId)));
  return ok({ count: await countFor(key) });
}
