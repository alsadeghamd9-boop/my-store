export const dynamic = "force-dynamic";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { BAD_REQUEST, fail, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { parseProductInput } from "@/lib/product-input";

/** Admin: create a product. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);

  const parsed = parseProductInput(body);
  if (parsed.fields) return fail("راجع الحقول المشار إليها.", 422, { fields: parsed.fields });

  const [category] = await getDb().select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, parsed.data.categoryId))
    .limit(1);
  if (!category) {
    return fail("راجع الحقول المشار إليها.", 422, { fields: { categoryId: "اختر القسم." } });
  }

  const [created] = await getDb().insert(products)
    .values({ ...parsed.data, slug: `item-${randomBytes(5).toString("hex")}` })
    .returning({ id: products.id, slug: products.slug });
  return ok(created);
}
