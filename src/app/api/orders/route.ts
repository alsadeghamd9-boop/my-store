import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cartItems, orderItems, orders, products } from "@/db/schema";
import { BAD_REQUEST, fail, ok, readJson, str } from "@/lib/api";
import { getCurrentUser, sha256 } from "@/lib/auth";
import { getOwnerKey } from "@/lib/cart";
import { SUDAN_STATES, shippingFor } from "@/lib/constants";
import { grantGuestOrderAccess, newGuestOrderToken } from "@/lib/order-access";
import { newOrderNumber } from "@/lib/orders";
import { normalizePhone } from "@/lib/phone";
import { BANK_ACCOUNTS, WALLET_ACCOUNTS } from "@/lib/payment-accounts";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
class CheckoutError extends Error {}

/** Create an order from the server-side cart, using locked, authoritative prices and stock. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  await ensureSeeded();
  const user = await getCurrentUser();
  const ownerKey = await getOwnerKey();
  if (!ownerKey) return fail("سلتك فارغة. أضف منتجات ثم أعد المحاولة.", 409);

  const name = str(body.name, 80);
  const phone = normalizePhone(str(body.phone, 24));
  const state = str(body.state, 50);
  const city = str(body.city, 80);
  const district = str(body.district, 80);
  const street = str(body.street, 160);
  const notes = str(body.notes, 300);
  const method = str(body.paymentMethod, 20);
  const provider = str(body.paymentProvider, 60);
  const reference = str(body.paymentReference, 120);
  const fields: Record<string, string> = {};
  if (name.length < 3) fields.name = "اكتب الاسم الكامل للمستلم.";
  if (!phone) fields.phone = "اكتب رقم هاتف سودانياً صحيحاً، مثل 0912345678.";
  if (!(SUDAN_STATES as readonly string[]).includes(state)) fields.state = "اختر الولاية.";
  if (city.length < 2) fields.city = "اكتب المدينة أو المحلية.";
  if (district.length < 2) fields.district = "اكتب اسم الحي أو المنطقة.";
  if (street.length < 4) fields.street = "اكتب عنواناً واضحاً للتوصيل.";
  if (!["cod", "bank", "wallet"].includes(method)) fields.paymentMethod = "اختر طريقة الدفع.";
  if (method === "bank" && !BANK_ACCOUNTS.some((account) => account.id === provider)) fields.paymentProvider = "اختر البنك.";
  if (method === "wallet" && !WALLET_ACCOUNTS.some((account) => account.id === provider)) fields.paymentProvider = "اختر المحفظة.";
  if (Object.keys(fields).length) return fail("راجع الحقول المشار إليها.", 422, { fields });

  const guestToken = user ? null : newGuestOrderToken();
  try {
    const order = await getDb().transaction(async (tx) => {
      const lines = await tx.select({
        productId: products.id, title: products.title, images: products.images, price: products.price,
        stock: products.stock, active: products.active, quantity: cartItems.quantity,
      }).from(cartItems).innerJoin(products, eq(products.id, cartItems.productId))
        .where(eq(cartItems.ownerKey, ownerKey)).orderBy(asc(products.id)).for("update");
      if (!lines.length) throw new CheckoutError("سلتك فارغة. أضف منتجات ثم أعد المحاولة.");
      for (const line of lines) {
        if (!line.active || line.stock <= 0) throw new CheckoutError(`«${line.title}» غير متوفر حالياً.`);
        if (line.quantity < 1 || line.quantity > line.stock) throw new CheckoutError(`المتاح من «${line.title}» ${line.stock} فقط. عدّل الكمية في السلة.`);
      }
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      const shippingFee = shippingFor(subtotal);
      if (subtotal + shippingFee > 2_147_483_647) throw new CheckoutError("إجمالي الطلب أكبر من الحد المسموح. قسّم الطلب إلى طلبات أصغر.");
      const [created] = await tx.insert(orders).values({
        number: newOrderNumber(), userId: user?.id ?? null, guestAccessHash: guestToken ? sha256(guestToken) : null,
        status: "pending", subtotal, shippingFee, total: subtotal + shippingFee,
        paymentMethod: method, paymentProvider: method === "cod" ? "" : provider,
        paymentReference: method === "cod" ? "" : reference, paymentStatus: "pending",
        shipName: name, shipPhone: phone!, shipState: state, shipCity: city, shipDistrict: district, shipStreet: street, notes,
      }).returning({ id: orders.id, number: orders.number });
      await tx.insert(orderItems).values(lines.map((line) => ({ orderId: created.id, productId: line.productId, title: line.title, image: line.images[0] ?? "", price: line.price, quantity: line.quantity })));
      for (const line of lines) {
        await tx.update(products).set({ stock: sql`${products.stock} - ${line.quantity}`, soldCount: sql`${products.soldCount} + ${line.quantity}` }).where(eq(products.id, line.productId));
      }
      await tx.delete(cartItems).where(eq(cartItems.ownerKey, ownerKey));
      return created;
    });
    if (guestToken) await grantGuestOrderAccess(order.id, guestToken);
    return ok(order, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message, 409);
    console.error("Order creation failed", error);
    return fail("تعذّر إنشاء الطلب. لم يُخصم أي مبلغ؛ حاول مرة أخرى.", 500);
  }
}
