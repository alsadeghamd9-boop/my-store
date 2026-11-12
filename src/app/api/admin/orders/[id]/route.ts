import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { isOrderStatus } from "@/lib/constants";
import { restoreStock } from "@/lib/orders";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: Context) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);
  const id = int((await params).id);
  const status = body.status;
  const paymentStatus = body.paymentStatus;
  if (!id || id < 1 || (status === undefined && paymentStatus === undefined) || (status !== undefined && !isOrderStatus(status)) || (paymentStatus !== undefined && paymentStatus !== "pending" && paymentStatus !== "paid")) return fail(BAD_REQUEST);
  const result = await getDb().transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return "missing" as const;
    if (status !== undefined && status !== order.status) {
      if (order.status === "cancelled" || order.status === "delivered") return "final" as const;
      if (status === "cancelled") await restoreStock(tx, id);
    }
    await tx.update(orders).set({ ...(status !== undefined ? { status: status as string } : {}), ...(paymentStatus !== undefined ? { paymentStatus: paymentStatus as string } : {}) }).where(eq(orders.id, id));
    return "done" as const;
  });
  if (result === "missing") return fail("الطلب غير موجود.", 404);
  if (result === "final") return fail("لا يمكن تغيير حالة طلب ملغي أو تم تسليمه.", 409);
  return ok({ ok: true });
}

export async function DELETE(req: Request, { params }: Context) {
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);
  const id = int((await params).id);
  if (!id || id < 1) return fail("الطلب غير موجود.", 404);
  const removed = await getDb().transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return false;
    if (order.status !== "cancelled" && order.status !== "delivered") await restoreStock(tx, id);
    await tx.delete(orders).where(eq(orders.id, id));
    return true;
  });
  return removed ? ok({ ok: true }) : fail("الطلب غير موجود.", 404);
}
