import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getProductById, listReviews } from "@/db/queries";
import { fail, ok, readJson, slugify, toNumber, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

async function resolveCategoryId(value: unknown): Promise<number | null | undefined> {
  const slug = toStringValue(value);
  if (!slug) return undefined;
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  await ensureBootstrap();
  const { id } = await context.params;
  const productId = toNumber(id);
  if (!productId) return fail("منتج غير صالح", 404);
  const product = await getProductById(productId);
  if (!product) return fail("المنتج غير موجود", 404);
  const productReviews = await listReviews(productId);
  return ok({ product, reviews: productReviews });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  await ensureBootstrap();
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);

  const { id } = await context.params;
  const productId = toNumber(id);
  if (!productId) return fail("منتج غير صالح", 404);

  const body = await readJson(req);
  const patch: Partial<typeof products.$inferInsert> = {};

  const title = toStringValue(body.title);
  if (title) {
    patch.title = title;
    if (toStringValue(body.slug)) patch.slug = slugify(toStringValue(body.slug));
  }
  if (body.brand !== undefined) patch.brand = toStringValue(body.brand) || null;
  if (body.description !== undefined) patch.description = toStringValue(body.description);
  const price = toNumber(body.price);
  if (price !== undefined && price > 0) patch.price = price;
  if (body.oldPrice !== undefined) {
    const oldPrice = toNumber(body.oldPrice);
    patch.oldPrice = oldPrice && oldPrice > (price ?? 0) ? oldPrice : null;
  }
  const stock = toNumber(body.stock);
  if (stock !== undefined) patch.stock = Math.max(0, Math.round(stock));
  if (body.bullets !== undefined) {
    patch.bullets = Array.isArray(body.bullets)
      ? body.bullets.map((entry) => toStringValue(entry)).filter(Boolean)
      : toStringValue(body.bullets).split(/[\n,؛]+/).map((entry) => entry.trim()).filter(Boolean);
  }
  if (body.gallery !== undefined) {
    patch.gallery = Array.isArray(body.gallery)
      ? body.gallery.map((entry) => toStringValue(entry)).filter(Boolean)
      : toStringValue(body.gallery).split(/[\n,]+/).map((entry) => entry.trim()).filter(Boolean);
  }
  const image = toStringValue(body.image);
  if (image) patch.image = image;
  if (body.featured !== undefined) patch.featured = Boolean(body.featured);
  if (body.fastShipping !== undefined) patch.fastShipping = Boolean(body.fastShipping);
  const categoryId = await resolveCategoryId(body.categorySlug);
  if (categoryId !== undefined) patch.categoryId = categoryId;

  if (Object.keys(patch).length === 0) return fail("لا توجد تغييرات");

  const [updated] = await db
    .update(products)
    .set(patch)
    .where(eq(products.id, productId))
    .returning();
  if (!updated) return fail("المنتج غير موجود", 404);

  return ok({ product: updated });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  await ensureBootstrap();
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);

  const { id } = await context.params;
  const productId = toNumber(id);
  if (!productId) return fail("منتج غير صالح", 404);

  await db.delete(products).where(eq(products.id, productId));
  return ok({ ok: true, id: productId });
}
