import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { BAD_REQUEST, clientIp, fail, ok, readJson, str } from "@/lib/api";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { clearLoginRateLimit, loginRateLimit } from "@/lib/login-rate-limit";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
let dummyHash: Promise<string> | undefined;
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const email = str(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return fail("اكتب البريد الإلكتروني وكلمة المرور.", 422);
  await ensureSeeded();
  if (!(await loginRateLimit(`login-ip:${clientIp(req)}`, 50, 10)) || !(await loginRateLimit(`login-account:${email}`, 10, 10))) {
    return fail("محاولات كثيرة لتسجيل الدخول. انتظر بضع دقائق ثم حاول مجدداً.", 429);
  }
  const [user] = await getDb().select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.email, email)).limit(1);
  // Check a random bcrypt hash for unknown users as well, to reduce timing leaks.
  dummyHash ??= hashPassword(randomBytes(24).toString("hex"));
  const valid = await verifyPassword(password, user?.passwordHash ?? await dummyHash);
  if (!user || !valid) return fail("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);
  await clearLoginRateLimit(`login-account:${email}`);
  await createSession(user.id);
  await mergeGuestCart(user.id);
  return ok({ ok: true });
}
