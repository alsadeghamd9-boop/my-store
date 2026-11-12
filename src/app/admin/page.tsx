export const dynamic = "force-dynamic";

import { requireAdminPage } from "@/lib/admin-auth";
import Link from "next/link";
import { and, asc, count, desc, eq, lte, ne, sql } from "drizzle-orm";
import { Boxes, ClipboardList, Users, Wallet } from "lucide-react";
import { OrderStatusBadge } from "@/components/Badges";
import { Money } from "@/components/Price";
import { getDb } from "@/db";
import { orders, products, users } from "@/db/schema";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatCount, formatDate } from "@/lib/format";

export default async function AdminDashboard() {
  await requireAdminPage();
  const [[sales], [orderTotal], [productTotal], [customerTotal], lowStock, recent, byStatus] =
    await Promise.all([
      getDb().select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::float8` })
        .from(orders)
        .where(ne(orders.status, "cancelled")),
      getDb().select({ n: count() }).from(orders),
      getDb().select({ n: count() }).from(products).where(eq(products.active, true)),
      getDb().select({ n: count() })
        .from(users)
        .where(eq(users.role, "customer")),
      getDb().select({ id: products.id, title: products.title, stock: products.stock })
        .from(products)
        .where(and(eq(products.active, true), lte(products.stock, 5)))
        .orderBy(asc(products.stock))
        .limit(8),
      getDb().select({
          id: orders.id,
          number: orders.number,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          shipName: orders.shipName,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(6),
      getDb().select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    ]);

  const statusCount = new Map(byStatus.map((r) => [r.status, r.n]));
  const stats = [
    {
      icon: Wallet,
      label: "إجمالي الطلبات",
      value: <Money value={sales.total} />,
      note: "يشمل الطلبات غير المدفوعة، ولا يشمل الملغاة",
    },
    {
      icon: ClipboardList,
      label: "الطلبات",
      value: formatCount(orderTotal.n),
      note: `${formatCount(statusCount.get("pending") ?? 0)} بانتظار المراجعة`,
    },
    {
      icon: Boxes,
      label: "منتجات معروضة",
      value: formatCount(productTotal.n),
      note: `${formatCount(lowStock.length)} بمخزون منخفض`,
    },
    {
      icon: Users,
      label: "العملاء المسجّلون",
      value: formatCount(customerTotal.n),
      note: "حسابات العملاء",
    },
  ];

  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, note }) => (
          <li key={label} className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Icon size={17} aria-hidden="true" />
              {label}
            </div>
            <p className="mt-2 font-display text-xl font-bold text-ink-950 sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-muted">{note}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card" aria-labelledby="recent-orders">
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <h2 id="recent-orders" className="text-lg font-bold text-ink-950">
              أحدث الطلبات
            </h2>
            <Link
              href="/admin/orders"
              className="rounded text-sm font-semibold text-ink-700 hover:underline"
            >
              كل الطلبات
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="border-t border-line p-6 text-center text-sm text-muted">
              لا توجد طلبات بعد. ستظهر هنا فور وصول أول طلب.
            </p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-paper/60 sm:px-5"
                  >
                    <span className="font-semibold text-ink-950" dir="ltr">
                      {o.number}
                    </span>
                    <span className="text-body">{o.shipName}</span>
                    <span className="text-muted">{formatDate(o.createdAt)}</span>
                    <span className="ms-auto flex items-center gap-3">
                      <Money value={o.total} className="font-semibold text-ink-950" />
                      <OrderStatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="card p-4 sm:p-5" aria-labelledby="by-status">
            <h2 id="by-status" className="text-lg font-bold text-ink-950">
              الطلبات حسب الحالة
            </h2>
            <ul className="mt-3 space-y-2.5">
              {ORDER_STATUSES.map((s) => (
                <li key={s}>
                  <Link
                    href={`/admin/orders?status=${s}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"
                  >
                    <OrderStatusBadge status={s} />
                    <span className="sr-only">{STATUS_LABELS[s]}:</span>
                    <span className="font-semibold text-ink-950">
                      {formatCount(statusCount.get(s) ?? 0)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="low-stock">
            <h2 id="low-stock" className="text-lg font-bold text-ink-950">
              مخزون منخفض
            </h2>
            {lowStock.length === 0 ? (
              <p className="mt-3 text-sm text-muted">كل المنتجات متوفرة بكميات كافية.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"
                    >
                      <span className="line-clamp-1 text-body">{p.title}</span>
                      <span
                        className={`shrink-0 font-semibold ${
                          p.stock === 0 ? "text-deal" : "text-[#8a5a00]"
                        }`}
                      >
                        {p.stock === 0 ? "نفد" : `بقي ${p.stock}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
