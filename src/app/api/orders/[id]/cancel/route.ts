import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { canAccessOrder } from "@/lib/order-access";
import { restoreStock } from "@/lib/orders";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  await ensureSeeded();
  const user = await getCurrentUser();
  const id = int((await params).id);
  if (!id || id < 1) return fail("الطلب غير موجود.", 404);
  const result = await getDb().transaction(async (tx) => {
    const [order] = await tx.select({ id: orders.id, userId: orders.userId, guestAccessHash: orders.guestAccessHash, status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order || !(await canAccessOrder(order, user))) return "missing" as const;
    if (order.status !== "pending" && order.status !== "processing") return "locked" as const;
    await restoreStock(tx, id);
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, id));
    return "done" as const;
  });
  if (result === "missing") return fail("الطلب غير موجود.", 404);
  if (result === "locked") return fail("لا يمكن إلغاء الطلب بعد شحنه.", 409);
  return ok({ ok: true });
}
