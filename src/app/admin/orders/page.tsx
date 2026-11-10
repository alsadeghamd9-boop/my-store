import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { Money } from "@/components/Price";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { ORDER_STATUSES, STATUS_LABELS, isOrderStatus } from "@/lib/constants";
import { formatCount, formatDate } from "@/lib/format";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const filter = isOrderStatus(raw) ? raw : undefined;

  const [rows, byStatus] = await Promise.all([
    db
      .select({
        id: orders.id,
        number: orders.number,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        shipName: orders.shipName,
        shipCity: orders.shipCity,
        shipPhone: orders.shipPhone,
        email: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(filter ? eq(orders.status, filter) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(200),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);

  const counts = new Map(byStatus.map((r) => [r.status, r.n]));
  const all = byStatus.reduce((n, r) => n + r.n, 0);
  const tabs = [
    { key: undefined, label: "الكل", n: all },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], n: counts.get(s) ?? 0 })),
  ];

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="text-lg font-bold text-ink-950">
        الطلبات
      </h2>

      <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="تصفية حسب الحالة">
        {tabs.map((t) => {
          const active = t.key === filter;
          return (
            <li key={t.label} className="shrink-0">
              <Link
                href={t.key ? `/admin/orders?status=${t.key}` : "/admin/orders"}
                aria-current={active ? "true" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                  active
                    ? "bg-ink-900 text-white"
                    : "border border-line bg-white text-body hover:border-ink-700"
                }`}
              >
                {t.label}
                <span className={active ? "text-ink-100" : "text-muted"}>{formatCount(t.n)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 ? (
        <p className="card mt-4 p-8 text-center text-sm text-muted">
          {filter
            ? `لا توجد طلبات بحالة «${STATUS_LABELS[filter]}» حالياً.`
            : "لا توجد طلبات بعد. ستظهر هنا فور وصول أول طلب."}
        </p>
      ) : (
        <div className="card thin-scrollbar mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-muted">
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  رقم الطلب
                </th>
                <th scope="col" className="px-3 py-3 text-start font-medium">
                  التاريخ
                </th>
                <th scope="col" className="px-3 py-3 text-start font-medium">
                  العميل
                </th>
                <th scope="col" className="px-3 py-3 text-start font-medium">
                  المدينة
                </th>
                <th scope="col" className="px-3 py-3 text-start font-medium">
                  الإجمالي
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/orders/${o.id}`}
                      className="rounded font-semibold text-ink-700 underline hover:text-ink-950"
                      dir="ltr"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-body">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-body">{o.shipName}</p>
                    <p className="text-end text-xs text-muted" dir="ltr">
                      {o.shipPhone}
                    </p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-body">{o.shipCity}</td>
                  <td className="px-3 py-3">
                    <Money value={o.total} className="font-semibold text-ink-950" />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect orderId={o.id} number={o.number} status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
