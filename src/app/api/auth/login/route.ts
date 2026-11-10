import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { users } from "@/db/schema";
import { signInSession } from "@/lib/auth";
import { fail, ok, readJson, toStringValue } from "@/lib/api";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureBootstrap();
  const body = await readJson(req);
  const email = toStringValue(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) return fail("البريد الإلكتروني وكلمة المرور مطلوبان");

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail("بيانات الدخول غير صحيحة", 401);
  }

  await signInSession(user.id);

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      address: user.address,
    },
  });
}
