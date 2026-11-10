import { requireAdmin } from "@/lib/auth";
import { listAllOrders } from "@/db/queries";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);
  const orders = await listAllOrders(200);
  return ok({ orders });
}
