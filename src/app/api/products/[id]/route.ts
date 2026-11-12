import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { fail, int, ok } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = int((await params).id);
  if (!id || id < 1) return fail("المنتج غير موجود.", 404);
  await ensureSeeded();
  const [product] = await getDb().select({ product: products, category: categories.name }).from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId)).where(and(eq(products.id, id), eq(products.active, true))).limit(1);
  return product ? ok(product) : fail("المنتج غير موجود.", 404);
}
