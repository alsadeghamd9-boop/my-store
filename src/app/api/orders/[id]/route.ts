import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getOrderWithItems } from "@/db/queries";
import { fail, ok, toNumber } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orderId = toNumber(id);
  if (!orderId) return fail("طلب غير صالح", 404);

  const data = await getOrderWithItems(orderId);
  if (!data) return fail("الطلب غير موجود", 404);

  const user = await getCurrentUser();
  const admin = await requireAdmin();
  const isOwner = user && data.order.userId === user.id;
  const isGuestAllowed = !data.order.userId;

  if (!admin && !isOwner && !isGuestAllowed) {
    return fail("ليس لديك صلاحية لعرض هذا الطلب", 403);
  }

  return ok(data);
}
