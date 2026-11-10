import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, readJson, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  await ensureBootstrap();
  const user = await getCurrentUser();
  if (!user) return fail("يجب تسجيل الدخول", 401);

  const body = await readJson(req);
  const name = toStringValue(body.name);
  const phone = toStringValue(body.phone);
  const city = toStringValue(body.city);
  const address = toStringValue(body.address);

  const patch: Partial<typeof users.$inferInsert> = {};
  if (name.length >= 2) patch.name = name;
  if (body.phone !== undefined) patch.phone = phone || null;
  if (body.city !== undefined) patch.city = city || null;
  if (body.address !== undefined) patch.address = address || null;

  if (Object.keys(patch).length === 0) return fail("لا توجد تغييرات لحفظها");

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, user.id))
    .returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, city: users.city, address: users.address, role: users.role });

  return ok({ user: updated });
}
