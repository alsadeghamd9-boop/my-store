import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { BAD_REQUEST, fail, ok, rateLimit, readJson } from "@/lib/api";
import { getCurrentUser, hashPassword, revokeOtherSessions, verifyPassword } from "@/lib/auth";

/** Change the signed-in user's password and sign out their other devices. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول أولاً.", 401);
  if (!rateLimit(`password:${user.id}`, 8, 10 * 60_000)) {
    return fail("محاولات كثيرة. انتظر بضع دقائق ثم حاول مجدداً.", 429);
  }

  const current = typeof body.current === "string" ? body.current.slice(0, 200) : "";
  const next = typeof body.next === "string" ? body.next : "";
  const fields: Record<string, string> = {};
  if (!current) fields.current = "اكتب كلمة المرور الحالية.";
  if (next.length < 8) fields.next = "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.";
  else if (next.length > 200) fields.next = "كلمة المرور طويلة جداً.";
  else if (next === current) fields.next = "اختر كلمة مرور مختلفة عن الحالية.";
  if (Object.keys(fields).length) return fail("راجع الحقول المشار إليها.", 422, { fields });

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return fail("راجع الحقول المشار إليها.", 422, {
      fields: { current: "كلمة المرور الحالية غير صحيحة." },
    });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(users.id, user.id));
  await revokeOtherSessions(user.id);
  return ok({ ok: true });
}
