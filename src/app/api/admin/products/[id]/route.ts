import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, categories, products } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { parseProductInput } from "@/lib/product-input";

/**
 * Admin: update a product. Sending only `{ active }` archives or restores it;
 * archived products disappear from the shop but stay in past orders.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);
  const id = int((await params).id);
  if (!id) return fail("المنتج غير موجود.", 404);

  if (typeof body.active === "boolean" && body.title === undefined) {
    const updated = await db
      .update(products)
      .set({ active: body.active })
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!updated.length) return fail("المنتج غير موجود.", 404);
    if (!body.active) await db.delete(cartItems).where(eq(cartItems.productId, id));
    return ok({ ok: true, active: body.active });
  }

  const parsed = parseProductInput(body);
  if (parsed.fields) return fail("راجع الحقول المشار إليها.", 422, { fields: parsed.fields });

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, parsed.data.categoryId))
    .limit(1);
  if (!category) {
    return fail("راجع الحقول المشار إليها.", 422, { fields: { categoryId: "اختر القسم." } });
  }

  const updated = await db
    .update(products)
    .set(parsed.data)
    .where(eq(products.id, id))
    .returning({ id: products.id, slug: products.slug });
  if (!updated.length) return fail("المنتج غير موجود.", 404);
  return ok(updated[0]);
}
