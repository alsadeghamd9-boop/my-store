import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import CheckoutForm from "@/components/CheckoutForm";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { itemsLabel } from "@/lib/format";

export const metadata: Metadata = { title: "إتمام الطلب" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const cart = await getCart();
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

  // Prefill from the shopper's most recent order.
  const [last] = await db
    .select({
      name: orders.shipName,
      phone: orders.shipPhone,
      city: orders.shipCity,
      district: orders.shipDistrict,
      street: orders.shipStreet,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.id))
    .limit(1);

  const summary = (
    <>
      <h2 className="text-lg font-bold text-ink-950">ملخص الطلب</h2>
      <ul className="mt-4 space-y-3">
        {cart.lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-3">
            <SmartImage
              src={line.image}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg bg-paper object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug text-body">{line.title}</p>
              <p className="mt-0.5 text-xs text-muted">الكمية: {line.quantity}</p>
            </div>
            <Money value={line.lineTotal} className="text-sm font-semibold text-ink-950" />
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">المجموع الفرعي ({itemsLabel(cart.count)})</dt>
          <dd>
            <Money value={cart.subtotal} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">التوصيل</dt>
          <dd>
            {cart.shipping === 0 ? (
              <span className="font-semibold text-express">مجاني</span>
            ) : (
              <Money value={cart.shipping} />
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-base">
          <dt className="font-bold text-ink-950">الإجمالي عند الاستلام</dt>
          <dd>
            <Money value={cart.total} className="font-display font-bold text-ink-950" />
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">الأسعار شاملة ضريبة القيمة المضافة.</p>
    </>
  );

  return (
    <div className="container-page py-5">
      <h1 className="mb-4 text-2xl font-bold text-ink-950">إتمام الطلب</h1>
      <CheckoutForm
        defaults={{
          name: last?.name ?? user.name,
          phone: last?.phone ?? "",
          city: last?.city ?? "",
          district: last?.district ?? "",
          street: last?.street ?? "",
        }}
        summary={summary}
      />
    </div>
  );
}
