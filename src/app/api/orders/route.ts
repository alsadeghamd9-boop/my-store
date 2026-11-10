import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, orderItems, orders, products } from "@/db/schema";
import { BAD_REQUEST, fail, ok, readJson, str } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { CITIES, shippingFor } from "@/lib/constants";
import { newOrderNumber, normalizePhone } from "@/lib/orders";

class CheckoutError extends Error {}

/** Place an order from the signed-in shopper's cart. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);

  const user = await getCurrentUser();
  if (!user) return fail("سجّل الدخول لإتمام الطلب.", 401);

  const name = str(body.name, 80);
  const phone = normalizePhone(str(body.phone, 24));
  const city = str(body.city, 40);
  const district = str(body.district, 80);
  const street = str(body.street, 160);
  const notes = str(body.notes, 300);
  const paymentMethod = str(body.paymentMethod, 12);

  const fields: Record<string, string> = {};
  if (name.length < 3) fields.name = "اكتب الاسم الكامل للمستلم.";
  if (!phone) fields.phone = "اكتب رقم جوال سعودي صحيح، مثل 0512345678.";
  if (!CITIES.includes(city)) fields.city = "اختر المدينة من القائمة.";
  if (district.length < 2) fields.district = "اكتب اسم الحي.";
  if (street.length < 4) fields.street = "اكتب اسم الشارع ورقم المبنى.";
  if (Object.keys(fields).length) return fail("راجع الحقول المشار إليها.", 422, { fields });
  if (paymentMethod !== "cod") return fail("طريقة الدفع هذه غير متاحة حالياً.", 422);

  const ownerKey = `u:${user.id}`;
  try {
    const order = await db.transaction(async (tx) => {
      // Lock the product rows so two shoppers can't buy the last unit at once.
      const lines = await tx
        .select({
          productId: products.id,
          title: products.title,
          images: products.images,
          price: products.price,
          stock: products.stock,
          active: products.active,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .innerJoin(products, eq(products.id, cartItems.productId))
        .where(eq(cartItems.ownerKey, ownerKey))
        .orderBy(asc(products.id))
        .for("update");

      if (lines.length === 0) throw new CheckoutError("سلتك فارغة. أضف منتجات ثم أعد المحاولة.");
      for (const l of lines) {
        if (!l.active || l.stock <= 0) {
          throw new CheckoutError(`«${l.title}» غير متوفر حالياً. أزله من السلة للمتابعة.`);
        }
        if (l.quantity > l.stock) {
          throw new CheckoutError(
            `المتاح من «${l.title}» ${l.stock} فقط. عدّل الكمية في السلة للمتابعة.`,
          );
        }
      }

      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const shippingFee = shippingFor(subtotal);
      const [created] = await tx
        .insert(orders)
        .values({
          number: newOrderNumber(),
          userId: user.id,
          status: "pending",
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentMethod: "cod",
          shipName: name,
          shipPhone: phone!,
          shipCity: city,
          shipDistrict: district,
          shipStreet: street,
          notes,
        })
        .returning({ id: orders.id, number: orders.number });

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: created.id,
          productId: l.productId,
          title: l.title,
          image: l.images[0] ?? "",
          price: l.price,
          quantity: l.quantity,
        })),
      );
      for (const l of lines) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${l.quantity}`,
            soldCount: sql`${products.soldCount} + ${l.quantity}`,
          })
          .where(eq(products.id, l.productId));
      }
      await tx.delete(cartItems).where(eq(cartItems.ownerKey, ownerKey));
      return created;
    });
    return ok({ id: order.id, number: order.number });
  } catch (err) {
    if (err instanceof CheckoutError) return fail(err.message, 409);
    console.error("order failed", err);
    return fail("تعذّر إنشاء الطلب بسبب خطأ لدينا. لم يُخصم شيء — حاول مرة أخرى.", 500);
  }
}
