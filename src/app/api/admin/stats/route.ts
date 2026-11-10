import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/db/queries";
import { fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);
  const stats = await getAdminStats();
  return ok(stats);
}
