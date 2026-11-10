import { getCurrentUser, readSessionId } from "@/lib/auth";
import { createOrder, listOrdersForUser } from "@/db/queries";
import { fail, ok, readJson, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("يجب تسجيل الدخول لعرض الطلبات", 401);
  const orders = await listOrdersForUser(user.id);
  return ok({ orders });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const session = await readSessionId();
  const body = await readJson(req);

  const fullName = toStringValue(body.fullName);
  const phone = toStringValue(body.phone);
  const city = toStringValue(body.city);
  const address = toStringValue(body.address);
  const email = toStringValue(body.email) || user?.email || null;
  const notes = toStringValue(body.notes) || null;
  const paymentMethod = body.paymentMethod === "card" ? "card" : "cod";
  const promoCode = toStringValue(body.promoCode) || null;

  if (fullName.length < 3) return fail("الاسم الكامل مطلوب");
  if (!/^[0-9+\s-]{7,15}$/.test(phone)) return fail("رقم الجوال غير صحيح");
  if (city.length < 2) return fail("المدينة مطلوبة");
  if (address.length < 5) return fail("العنوان التفصيلي مطلوب");

  const sessionId = user ? await ensureUserSession(user.id, session) : session;
  if (!sessionId) return fail("تعذّر إنشاء الجلسة، حاول مرة أخرى", 500);

  try {
    const order = await createOrder({
      sessionId,
      userId: user?.id ?? null,
      customer: { fullName, email, phone, city, address, notes },
      paymentMethod,
      promoCode,
    });
    return ok({ id: order.id, reference: order.reference, total: order.total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ORDER_FAILED";
    if (message === "EMPTY_CART") return fail("سلة التسوق فارغة");
    if (message.startsWith("OUT_OF_STOCK")) {
      return fail(`عذرًا، نفدت الكمية المطلوبة من: ${message.split(":")[1] ?? "أحد المنتجات"}`, 409);
    }
    return fail("تعذّر إتمام الطلب، حاول مرة أخرى", 500);
  }
}

async function ensureUserSession(userId: number, sessionId: string | null): Promise<string | null> {
  if (!sessionId) {
    const { ensureSession } = await import("@/lib/auth");
    const created = await ensureSession();
    return created.id;
  }
  return sessionId;
}
