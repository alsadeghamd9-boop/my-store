import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { parseCategory } from "@/lib/category-input";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  const body = await readJson(req);
  const id = int((await params).id);
  if (!body || !id || id < 1) return fail(BAD_REQUEST);
  const parsed = parseCategory(body);
  if (parsed.error) return fail(parsed.error, 422);
  const [updated] = await getDb().update(categories).set(parsed.data).where(eq(categories.id, id)).returning();
  return updated ? ok(updated) : fail("القسم غير موجود.", 404);
}
export async function DELETE(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  const id = int((await params).id);
  if (!id || id < 1) return fail("القسم غير موجود.", 404);
  const [linked] = await getDb().select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
  if (linked) return fail("لا يمكن حذف قسم يحتوي على منتجات. انقلها أو احذفها أولاً.", 409);
  try {
    const [deleted] = await getDb().delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
    return deleted ? ok({ ok: true }) : fail("القسم غير موجود.", 404);
  } catch (error) {
    // The foreign key also protects against a product being added concurrently.
    if (error instanceof Error && error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "23503") {
      return fail("لا يمكن حذف قسم يحتوي على منتجات. انقلها أو احذفها أولاً.", 409);
    }
    console.error("Category deletion failed", error);
    return fail("تعذّر حذف القسم. حاول مرة أخرى.", 500);
  }
}
