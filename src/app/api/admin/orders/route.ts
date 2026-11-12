import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  const rows = await getDb().select({ id: orders.id, number: orders.number, status: orders.status, total: orders.total, paymentMethod: orders.paymentMethod, paymentProvider: orders.paymentProvider, paymentStatus: orders.paymentStatus, shipName: orders.shipName, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt)).limit(200);
  return ok({ orders: rows });
}
