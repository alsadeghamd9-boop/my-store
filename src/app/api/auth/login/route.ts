import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { BAD_REQUEST, clientIp, fail, ok, rateLimit, readJson, str } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { ensureSeeded } from "@/lib/seed";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);

  const email = str(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return fail("اكتب البريد الإلكتروني وكلمة المرور.", 422);

  if (!rateLimit(`login:${clientIp(req)}:${email}`, 10, 10 * 60_000)) {
    return fail("محاولات كثيرة لتسجيل الدخول. انتظر بضع دقائق ثم حاول مجدداً.", 429);
  }
  await ensureSeeded();

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same message for unknown e-mail and wrong password, so accounts can't be probed.
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) return fail("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);

  await createSession(user.id);
  await mergeGuestCart(user.id);
  return ok({ ok: true });
}
