import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { restoreStock } from "@/lib/orders";

/** A shopper can cancel their own order until it ships. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول أولاً.", 401);
  const id = int((await params).id);
  if (!id) return fail("الطلب غير موجود.", 404);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select({ userId: orders.userId, status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .for("update");
    if (!order || (order.userId !== user.id && user.role !== "admin")) return "missing" as const;
    if (order.status !== "pending" && order.status !== "processing") return "locked" as const;
    await restoreStock(tx, id);
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, id));
    return "done" as const;
  });

  if (result === "missing") return fail("الطلب غير موجود.", 404);
  if (result === "locked") {
    return fail("لا يمكن إلغاء الطلب بعد شحنه. راجع صفحة المساعدة لطلب الإرجاع.", 409);
  }
  return ok({ ok: true });
}
