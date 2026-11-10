import { requireAdmin } from "@/lib/auth";
import { getOrderWithItems, updateOrderStatus } from "@/db/queries";
import { fail, ok, readJson, toNumber, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

const VALID = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);

  const { id } = await context.params;
  const orderId = toNumber(id);
  if (!orderId) return fail("طلب غير صالح", 404);

  const body = await readJson(req);
  const status = toStringValue(body.status);
  if (!VALID.includes(status)) return fail("حالة غير صالحة");

  const updated = await updateOrderStatus(orderId, status);
  if (!updated) return fail("الطلب غير موجود", 404);

  return ok({ order: updated });
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);

  const { id } = await context.params;
  const orderId = toNumber(id);
  if (!orderId) return fail("طلب غير صالح", 404);

  const data = await getOrderWithItems(orderId);
  if (!data) return fail("الطلب غير موجود", 404);
  return ok(data);
}
