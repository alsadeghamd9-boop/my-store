import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { BAD_REQUEST, fail, int, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { isOrderStatus } from "@/lib/constants";
import { restoreStock } from "@/lib/orders";

/** Admin: move an order to a new status. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);
  const id = int((await params).id);
  const status = body.status;
  if (!id || !isOrderStatus(status)) return fail(BAD_REQUEST);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .for("update");
    if (!order) return "missing" as const;
    if (order.status === status) return "done" as const;
    // Cancelling returns stock to the shelf, so a cancelled order stays cancelled.
    if (order.status === "cancelled") return "final" as const;
    if (status === "cancelled") await restoreStock(tx, id);
    await tx.update(orders).set({ status }).where(eq(orders.id, id));
    return "done" as const;
  });

  if (result === "missing") return fail("الطلب غير موجود.", 404);
  if (result === "final") return fail("الطلب ملغي ولا يمكن تغيير حالته.", 409);
  return ok({ ok: true, status });
}
