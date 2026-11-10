import { ensureBootstrap } from "@/db/bootstrap";
import { addReview, getProductById, listReviews } from "@/db/queries";
import { ensureSession, getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson, toNumber, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureBootstrap();
  await ensureSession();
  const user = await getCurrentUser();
  const body = await readJson(req);

  const productId = toNumber(body.productId);
  const rating = Math.round(toNumber(body.rating) ?? 0);
  const title = toStringValue(body.title) || null;
  const bodyText = toStringValue(body.body);
  const author = user?.name || toStringValue(body.author);

  if (!productId) return fail("المنتج مطلوب");
  if (rating < 1 || rating > 5) return fail("التقييم يجب أن يكون بين 1 و 5");
  if (bodyText.length < 3) return fail("نص المراجعة مطلوب");
  if (author.length < 2) return fail("الاسم مطلوب");

  const product = await getProductById(productId);
  if (!product) return fail("المنتج غير موجود", 404);

  await addReview({ productId, userId: user?.id ?? null, author, rating, title, body: bodyText });
  const reviews = await listReviews(productId);

  return ok({ reviews }, { status: 201 });
}
