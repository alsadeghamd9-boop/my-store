import { count } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, orders, products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  const [[p], [c], [o]] = await Promise.all([getDb().select({ n: count() }).from(products), getDb().select({ n: count() }).from(categories), getDb().select({ n: count() }).from(orders)]);
  return ok({ products: p.n, categories: c.n, orders: o.n });
}
