import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { BAD_REQUEST, fail, ok, readJson, str } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("يجب تسجيل الدخول.", 401);
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const name = str(body.name, 60);
  if (name.length < 2) return fail("اكتب الاسم، حرفين على الأقل.", 422);
  await getDb().update(users).set({ name }).where(eq(users.id, user.id));
  return ok({ user: { ...user, name } });
}
