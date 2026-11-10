import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson, str } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { recomputeRating } from "@/lib/queries";

/** Create or update the signed-in shopper's review for a product. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  if (!body || !productId) return fail(BAD_REQUEST);

  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول لكتابة تقييم.", 401);

  const rating = int(body.rating);
  const title = str(body.title, 80);
  const text = str(body.body, 1000);
  const fields: Record<string, string> = {};
  if (!rating || rating < 1 || rating > 5) fields.rating = "اختر عدد النجوم من 1 إلى 5.";
  if (text.length < 10) fields.body = "اكتب رأيك في 10 أحرف على الأقل.";
  if (Object.keys(fields).length) return fail("راجع الحقول المشار إليها.", 422, { fields });

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.active, true)))
    .limit(1);
  if (!product) return fail("هذا المنتج لم يعد متوفراً.", 404);

  await db
    .insert(reviews)
    .values({ productId, userId: user.id, rating: rating!, title, body: text })
    .onConflictDoUpdate({
      target: [reviews.productId, reviews.userId],
      set: { rating: rating!, title, body: text, createdAt: new Date() },
    });
  await recomputeRating(productId);
  return ok({ ok: true });
}

/** Delete the signed-in shopper's own review. */
export async function DELETE(req: Request) {
  const body = await readJson(req);
  const productId = body ? int(body.productId) : null;
  if (!body || !productId) return fail(BAD_REQUEST);

  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول أولاً.", 401);

  await db
    .delete(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, user.id)));
  await recomputeRating(productId);
  return ok({ ok: true });
}
