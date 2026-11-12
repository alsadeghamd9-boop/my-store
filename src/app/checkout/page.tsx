import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import CheckoutForm from "@/components/CheckoutForm";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { itemsLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الطلب" };
export default async function CheckoutPage() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  if (!cart.lines.length || cart.hasIssues) redirect("/cart");
  const [last] = user ? await getDb().select({ name: orders.shipName, phone: orders.shipPhone, state: orders.shipState, city: orders.shipCity, district: orders.shipDistrict, street: orders.shipStreet })
    .from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.id)).limit(1) : [];
  const summary = <>
    <h2 className="text-lg font-bold text-ink-950">ملخص الطلب</h2>
    <ul className="mt-4 space-y-4">{cart.lines.map((line) => <li key={line.productId} className="flex items-center gap-3"><SmartImage src={line.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{line.title}</p><p className="mt-1 text-xs text-muted">الكمية: {line.quantity}</p></div><Money value={line.lineTotal} className="text-sm font-semibold" /></li>)}</ul>
    <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">المجموع الفرعي ({itemsLabel(cart.count)})</dt><dd><Money value={cart.subtotal} /></dd></div><div className="flex justify-between gap-3"><dt className="text-muted">التوصيل</dt><dd>{cart.shipping === 0 ? "مجاني" : <Money value={cart.shipping} />}</dd></div><div className="flex justify-between gap-3 border-t border-line pt-4 text-base font-bold"><dt>الإجمالي</dt><dd><Money value={cart.total} /></dd></div></dl>
  </>;
  return <div className="container-page py-7 sm:py-10"><p className="text-xs font-semibold text-terracotta">خطوة واحدة وتكمل فرحتك</p><h1 className="mt-2 mb-6 text-2xl font-bold text-ink-950 sm:text-3xl">إتمام الطلب</h1><CheckoutForm defaults={{ name: last?.name ?? user?.name ?? "", phone: last?.phone ?? "", state: last?.state ?? "", city: last?.city ?? "", district: last?.district ?? "", street: last?.street ?? "" }} summary={summary} /></div>;
}
