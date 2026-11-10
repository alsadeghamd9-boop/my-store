import Link from "next/link";
import { getAdminStats, listAllOrders } from "@/db/queries";
import { BoxIcon, SparkIcon, StarIcon, TruckIcon, UserIcon } from "@/components/icons";
import { formatDateTime, formatPrice, orderStatusLabel, orderStatusTone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, recent] = await Promise.all([getAdminStats(), listAllOrders(6)]);

  const maxRevenue = Math.max(1, ...stats.daily.map((day) => day.revenue));
  const statusTotals = Math.max(1, stats.statusRows.reduce((sum, row) => sum + row.count, 0));

  const kpis = [
    {
      label: "إجمالي الإيرادات",
      value: formatPrice(stats.revenue),
      icon: SparkIcon,
      tone: "from-emerald-500 to-teal-600",
      hint: `${stats.ordersCount.toLocaleString("ar-SA-u-nu-latn")} طلب مكتمل`,
    },
    {
      label: "الطلبات",
      value: stats.ordersCount.toLocaleString("ar-SA-u-nu-latn"),
      icon: TruckIcon,
      tone: "from-sky-500 to-indigo-600",
      hint: "منذ إطلاق المتجر",
    },
    {
      label: "المنتجات",
      value: stats.productsCount.toLocaleString("ar-SA-u-nu-latn"),
      icon: BoxIcon,
      tone: "from-amber-500 to-orange-600",
      hint: `${stats.lowStock} بمخزون منخفض`,
    },
    {
      label: "العملاء",
      value: stats.customers.toLocaleString("ar-SA-u-nu-latn"),
      icon: UserIcon,
      tone: "from-fuchsia-500 to-purple-600",
      hint: `${stats.reviewsCount} مراجعة منشورة`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-black text-ink-900">{kpi.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{kpi.hint}</p>
              </div>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ${kpi.tone}`}
              >
                <kpi.icon width={21} height={21} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900">الإيرادات — آخر 14 يومًا</h2>
            <span className="text-xs font-bold text-slate-500">
              إجمالي {formatPrice(stats.revenue)}
            </span>
          </div>
          {stats.daily.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              لا توجد طلبات بعد — ستظهر المبيعات هنا فور وصول أول طلب.
            </p>
          ) : (
            <div className="flex h-44 items-end gap-1.5">
              {stats.daily.map((day) => (
                <div key={day.day} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">
                    {formatPrice(day.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300 transition group-hover:from-ink-800 group-hover:to-ink-600"
                    style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                  />
                  <span className="text-[9px] text-slate-400" dir="ltr">
                    {day.day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-extrabold text-ink-900">حالة الطلبات</h2>
          <ul className="space-y-3">
            {stats.statusRows.length === 0 && (
              <li className="text-sm text-slate-500">لا توجد طلبات بعد.</li>
            )}
            {stats.statusRows.map((row) => (
              <li key={row.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${orderStatusTone(row.status)}`}>
                    {orderStatusLabel(row.status)}
                  </span>
                  <span className="font-black text-ink-900">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-ink-800"
                    style={{ width: `${(row.count / statusTotals) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/orders"
            className="mt-4 block rounded-full border border-slate-300 py-2 text-center text-sm font-bold text-ink-800 transition hover:bg-slate-50"
          >
            إدارة الطلبات ←
          </Link>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-extrabold text-ink-900">الأكثر مبيعًا</h2>
            <Link href="/admin/products" className="text-xs font-bold text-gold-600 hover:underline">
              كل المنتجات ←
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {stats.topProducts.map((product, index) => (
              <li key={product.id} className="flex items-center gap-3 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                  {index + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt="" className="h-11 w-11 rounded-lg bg-slate-50 object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${product.slug}`} className="line-clamp-1 text-sm font-bold hover:text-gold-600">
                    {product.title}
                  </Link>
                  <p className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{product.sold.toLocaleString("ar-SA-u-nu-latn")} مبيعة</span>
                    <span
                      className={`font-bold ${
                        product.stock === 0 ? "text-rose-600" : product.stock < 20 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      المخزون: {product.stock}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black">{formatPrice(product.price)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-extrabold text-ink-900">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-gold-600 hover:underline">
              عرض الكل ←
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">لا توجد طلبات بعد.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((order) => (
                <li key={order.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/orders/${order.id}`} className="text-sm font-black hover:text-gold-600" dir="ltr">
                      {order.reference}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {order.fullName} — {order.city} • {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${orderStatusTone(order.status)}`}>
                    {orderStatusLabel(order.status)}
                  </span>
                  <span className="shrink-0 text-sm font-black text-rose-600">
                    {formatPrice(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-200/60 text-gold-600">
            <StarIcon width={20} height={20} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-ink-900">تنبيهات المخزون</p>
            <p className="text-xs text-slate-500">
              {stats.lowStock} منتج بمخزون أقل من 20 قطعة، و{stats.outOfStock} منتج نفد تمامًا.
            </p>
          </div>
        </div>
        <Link
          href="/admin/products?filter=lowstock"
          className="btn-gold rounded-full px-5 py-2 text-sm font-extrabold"
        >
          مراجعة المخزون
        </Link>
      </section>
    </div>
  );
}
