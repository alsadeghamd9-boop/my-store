import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listOrdersWithItems } from "@/db/queries";
import { EmptyState } from "@/components/ui";
import { formatDateTime, formatPrice, orderStatusLabel, orderStatusTone } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "طلباتي | سوق" };

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          title="سجّل الدخول لعرض طلباتك"
          description="بعد تسجيل الدخول يمكنك متابعة حالة شحناتك، تنزيل فواتيرك، وإعادة الطلب بضغطة واحدة."
          action={
            <Link href="/account" className="btn-gold rounded-full px-8 py-2.5 text-sm font-extrabold">
              تسجيل الدخول / إنشاء حساب
            </Link>
          }
        />
      </div>
    );
  }

  const orders = await listOrdersWithItems(user.id);

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink-900">طلباتي</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.length.toLocaleString("ar-SA-u-nu-latn")} طلب — مرحبًا {user.name}
          </p>
        </div>
        <Link href="/products" className="text-sm font-bold text-gold-600 hover:underline">
          مواصلة التسوق ←
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات بعد"
          description="عند إتمام أول عملية شراء ستظهر جميع طلباتك هنا مع حالة الشحن والتوصيل."
          action={
            <Link href="/products" className="btn-gold rounded-full px-8 py-2.5 text-sm font-extrabold">
              ابدأ التسوق الآن
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span>
                    <span className="block text-[11px] text-slate-500">رقم الطلب</span>
                    <span className="font-black text-ink-900" dir="ltr">
                      {order.reference}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[11px] text-slate-500">تاريخ الطلب</span>
                    <span className="font-bold">{formatDateTime(order.createdAt)}</span>
                  </span>
                  <span>
                    <span className="block text-[11px] text-slate-500">الإجمالي</span>
                    <span className="font-black text-rose-600">{formatPrice(order.total)}</span>
                  </span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${orderStatusTone(order.status)}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex -space-x-3 space-x-reverse">
                  {order.items.slice(0, 4).map((item) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={item.id}
                      src={item.image ?? ""}
                      alt=""
                      className="h-14 w-14 rounded-lg border-2 border-white bg-slate-50 object-cover"
                    />
                  ))}
                  {order.items.length > 4 && (
                    <span className="grid h-14 w-14 place-items-center rounded-lg border-2 border-white bg-slate-100 text-xs font-black">
                      +{order.items.length - 4}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {order.items.slice(0, 2).map((item) => (
                    <p key={item.id} className="line-clamp-1 text-sm font-semibold text-ink-900">
                      {item.title} <span className="text-slate-400">× {item.quantity}</span>
                    </p>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-slate-500">و {order.items.length - 2} منتج آخر</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-ink-800 transition hover:bg-slate-50"
                  >
                    تفاصيل الطلب
                  </Link>
                  <Link
                    href={`/orders/${order.id}?reorder=1`}
                    className="btn-gold rounded-full px-4 py-2 text-sm font-extrabold"
                  >
                    إعادة الطلب
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
