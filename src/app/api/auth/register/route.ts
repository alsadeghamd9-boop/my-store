import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { users } from "@/db/schema";
import { signInSession } from "@/lib/auth";
import { fail, ok, readJson, toStringValue } from "@/lib/api";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureBootstrap();
  const body = await readJson(req);
  const name = toStringValue(body.name);
  const email = toStringValue(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const phone = toStringValue(body.phone) || null;
  const city = toStringValue(body.city) || null;
  const address = toStringValue(body.address) || null;

  if (name.length < 2) return fail("الاسم يجب أن يكون حرفين على الأقل");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("البريد الإلكتروني غير صحيح");
  if (password.length < 6) return fail("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return fail("هذا البريد الإلكتروني مسجّل بالفعل", 409);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      city,
      address,
      passwordHash: hashPassword(password),
      role: "customer",
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, city: users.city, address: users.address });

  await signInSession(user.id);

  return ok({ user });
}
