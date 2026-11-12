export const dynamic = "force-dynamic";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

/** Toggle a product in the signed-in shopper's wishlist. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  if (!body || !productId) return fail(BAD_REQUEST);

  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول لحفظ المنتجات في المفضلة.", 401);

  const where = and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, productId));
  const removed = await getDb().delete(wishlistItems).where(where).returning({ id: wishlistItems.productId });
  if (removed.length) return ok({ saved: false });

  const [product] = await getDb().select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);
  if (!product) return fail("هذا المنتج لم يعد متوفراً.", 404);

  await getDb().insert(wishlistItems).values({ userId: user.id, productId }).onConflictDoNothing();
  return ok({ saved: true });
}
