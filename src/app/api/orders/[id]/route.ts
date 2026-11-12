import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, int, ok } from "@/lib/api";
import { canAccessOrder } from "@/lib/order-access";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = int((await params).id);
  if (!id || id < 1) return fail("الطلب غير موجود.", 404);
  await ensureSeeded();
  const user = await getCurrentUser();
  const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || !(await canAccessOrder(order, user))) return fail("الطلب غير موجود.", 404);
  const items = await getDb().select().from(orderItems).where(eq(orderItems.orderId, id));
  // Never expose the guest capability hash.
  const { guestAccessHash: _guestAccessHash, ...publicOrder } = order;
  void _guestAccessHash;
  return ok({ order: publicOrder, items });
}
