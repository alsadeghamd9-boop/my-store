import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PaymentStatusSelect from "@/components/admin/PaymentStatusSelect";
import DeleteButton from "@/components/admin/DeleteButton";
import { Money } from "@/components/Price";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireAdminPage } from "@/lib/admin-auth";
import { ORDER_STATUSES, STATUS_LABELS, isOrderStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PAYMENT_LABELS, paymentProviderName } from "@/lib/payment-accounts";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdminPage();
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const filter = isOrderStatus(raw) ? raw : undefined;
  const [rows, byStatus] = await Promise.all([
    getDb().select().from(orders).where(filter ? eq(orders.status, filter) : undefined).orderBy(desc(orders.createdAt)).limit(200),
    getDb().select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  const counts = new Map(byStatus.map((row) => [row.status, row.n]));
  return <section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">إدارة الطلبات</h2><p className="mt-1 text-sm text-muted">راجع تفاصيل الطلب والدفع وحدّث حالته يدوياً.</p></div></div>
    <nav aria-label="تصفية الطلبات" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">{[{ key: undefined, label: "الكل", n: byStatus.reduce((n, row) => n + row.n, 0) }, ...ORDER_STATUSES.map((status) => ({ key: status, label: STATUS_LABELS[status], n: counts.get(status) ?? 0 }))].map((tab) => <Link key={tab.label} href={tab.key ? `/admin/orders?status=${tab.key}` : "/admin/orders"} aria-current={tab.key === filter ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab.key === filter ? "bg-ink-900 text-white" : "border border-line bg-white text-body"}`}>{tab.label} <span className="opacity-70">{tab.n}</span></Link>)}</nav>
    {!rows.length ? <div className="card mt-3 p-10 text-center text-sm text-muted">لا توجد طلبات في هذه القائمة بعد.</div> : <div className="card thin-scrollbar mt-3 overflow-x-auto"><table className="w-full min-w-[1150px] text-sm"><thead><tr className="border-b border-line bg-paper/60 text-muted">{["الطلب", "العميل والولاية", "الدفع", "الإجمالي", "حالة الدفع", "حالة الطلب", "إجراء"].map((head) => <th key={head} className="px-4 py-3 text-start font-medium">{head}</th>)}</tr></thead><tbody className="divide-y divide-line">{rows.map((order) => <tr key={order.id}><td className="px-4 py-4"><Link href={`/orders/${order.id}`} className="font-bold text-ink-700 underline" dir="ltr">{order.number}</Link><p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)}</p></td><td className="px-4 py-4"><p className="font-semibold">{order.shipName}</p><p className="mt-1 text-xs text-muted">{[order.shipState, order.shipCity].filter(Boolean).join("، ")}</p><p className="mt-1 text-xs text-muted" dir="ltr">{order.shipPhone}</p></td><td className="px-4 py-4"><p>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>{order.paymentProvider && <p className="mt-1 text-xs text-muted">{paymentProviderName(order.paymentProvider)}</p>}{order.paymentReference && <p className="mt-1 text-xs text-muted">المرجع: {order.paymentReference}</p>}</td><td className="px-4 py-4"><Money value={order.total} className="font-semibold" /></td><td className="px-4 py-4"><PaymentStatusSelect orderId={order.id} status={order.paymentStatus} /></td><td className="px-4 py-4"><OrderStatusSelect key={`${order.id}-${order.status}`} orderId={order.id} number={order.number} status={order.status} /></td><td className="px-4 py-4"><DeleteButton url={`/api/admin/orders/${order.id}`} label="حذف" confirmation="حذف الطلب نهائياً؟ ستُعاد كمياته للمخزون ما لم يكن ملغياً أو تم تسليمه." /></td></tr>)}</tbody></table></div>}
  </section>;
}
