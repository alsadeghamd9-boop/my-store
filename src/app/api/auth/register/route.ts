export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { BAD_REQUEST, clientIp, fail, ok, rateLimit, readJson, str } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { ensureSeeded } from "@/lib/seed";
import { validPasswordLength } from "@/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  if (!rateLimit(`register:${clientIp(req)}`, 15, 10 * 60_000)) {
    return fail("محاولات كثيرة. انتظر بضع دقائق ثم حاول مجدداً.", 429);
  }
  await ensureSeeded();

  const name = str(body.name, 60);
  const email = str(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "اكتب اسمك (حرفان على الأقل).";
  if (!EMAIL_RE.test(email)) fields.email = "اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.";
  if (password.length < 8) fields.password = "كلمة المرور يجب ألا تقل عن 8 أحرف.";
  else if (!validPasswordLength(password)) fields.password = "كلمة المرور طويلة جداً (الحد الأقصى 72 بايت).";
  if (Object.keys(fields).length) return fail("راجع الحقول المشار إليها.", 422, { fields });

  const taken = { fields: { email: "هذا البريد مسجّل مسبقاً." } };
  const existing = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return fail("هذا البريد مسجّل لدينا مسبقاً. جرّب تسجيل الدخول.", 409, taken);

  let userId: number;
  try {
    const [user] = await getDb().insert(users)
      .values({ name, email, passwordHash: await hashPassword(password) })
      .returning({ id: users.id });
    userId = user.id;
  } catch {
    return fail("هذا البريد مسجّل لدينا مسبقاً. جرّب تسجيل الدخول.", 409, taken);
  }

  await createSession(userId);
  await mergeGuestCart(userId);
  return ok({ ok: true });
}
