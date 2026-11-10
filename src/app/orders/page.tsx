import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { ChevronLeft, Package } from "lucide-react";
import { OrderStatusBadge } from "@/components/Badges";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, itemsLabel } from "@/lib/format";

export const metadata: Metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));
  const items = list.length
    ? await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            list.map((o) => o.id),
          ),
        )
    : [];

  return (
    <div className="container-page py-5">
      <h1 className="text-2xl font-bold text-ink-950">طلباتي</h1>

      {list.length === 0 ? (
        <div className="card mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-saffron-100 text-ink-900">
            <Package size={30} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-950">لا توجد طلبات بعد</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            عندما تُتم أول طلب ستجد هنا حالته وتفاصيله خطوة بخطوة.
          </p>
          <Link href="/search" className="btn btn-primary mt-6">
            ابدأ التسوق
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((order) => {
            const lines = items.filter((i) => i.orderId === order.id);
            const units = lines.reduce((n, l) => n + l.quantity, 0);
            return (
              <li key={order.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-paper/60 px-4 py-3 text-sm sm:px-5">
                  <p>
                    <span className="text-muted">رقم الطلب </span>
                    <span className="font-semibold text-ink-950" dir="ltr">
                      {order.number}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted">التاريخ </span>
                    <span className="font-medium text-body">{formatDate(order.createdAt)}</span>
                  </p>
                  <p>
                    <span className="text-muted">الإجمالي </span>
                    <Money value={order.total} className="font-semibold text-ink-950" />
                  </p>
                  <span className="ms-auto">
                    <OrderStatusBadge status={order.status} />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                  <ul className="flex gap-2" aria-label="منتجات الطلب">
                    {lines.slice(0, 4).map((l) => (
                      <li key={l.id}>
                        <SmartImage
                          src={l.image}
                          alt={l.title}
                          className="h-16 w-16 rounded-xl bg-paper object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="line-clamp-1 text-sm font-medium text-body">{lines[0]?.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{itemsLabel(units)}</p>
                  </div>
                  <Link href={`/orders/${order.id}`} className="btn btn-outline">
                    تفاصيل الطلب
                    <ChevronLeft size={16} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
