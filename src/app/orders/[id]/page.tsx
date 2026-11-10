import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getOrderWithItems } from "@/db/queries";
import ReorderButton from "@/components/ReorderButton";
import { BoxIcon, CheckIcon, PinIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import {
  formatDateTime,
  formatPrice,
  orderStatusLabel,
  orderStatusTone,
  ORDER_STATUSES,
} from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = { title: "تفاصيل الطلب | سوق" };

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const orderId = Number(id);
  if (!Number.isFinite(orderId) || orderId <= 0) notFound();

  const data = await getOrderWithItems(orderId);
  if (!data) notFound();

  const user = await getCurrentUser();
  const admin = await requireAdmin();
  const owner = user && data.order.userId === user.id;
  if (!admin && !owner && data.order.userId) notFound();

  const placed = sp.placed === "1";
  const status = data.order.status;
  const activeStep = ORDER_STATUSES[status]?.step ?? 0;
  const cancelled = status === "cancelled";

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-3 py-4 sm:px-4 sm:py-6">
      {placed && (
        <div className="card flex items-center gap-3 border-emerald-200 bg-emerald-50 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
            <CheckIcon width={22} height={22} />
          </span>
          <div>
            <h2 className="font-extrabold text-emerald-900">تم استلام طلبك بنجاح 🎉</h2>
            <p className="text-sm text-emerald-800">
              رقم الطلب <span dir="ltr" className="font-black">{data.order.reference}</span> — سنرسل
              لك تحديثات الشحن أولًا بأول.
            </p>
          </div>
        </div>
      )}

      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Link href="/orders" className="hover:text-gold-600">
                طلباتي
              </Link>
              <span>/</span>
              <span className="font-bold text-ink-800" dir="ltr">
                {data.order.reference}
              </span>
            </nav>
            <h1 className="text-2xl font-black text-ink-900">تفاصيل الطلب</h1>
            <p className="mt-1 text-sm text-slate-500">تم الطلب في {formatDateTime(data.order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-sm font-black ${orderStatusTone(status)}`}>
              {orderStatusLabel(status)}
            </span>
            <ReorderButton
              items={data.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))}
            />
          </div>
        </div>

        {!cancelled && (
          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {STEPS.map((key, index) => {
              const reached = activeStep >= index + 1;
              const meta = ORDER_STATUSES[key];
              return (
                <li key={key} className="relative">
                  <div
                    className={`flex items-center gap-2 rounded-xl border p-3 transition ${
                      reached ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                        reached ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {reached ? <CheckIcon width={16} height={16} /> : index + 1}
                    </span>
                    <span>
                      <span className={`block text-sm font-extrabold ${reached ? "text-emerald-900" : "text-slate-500"}`}>
                        {meta.label}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {reached ? "مكتمل" : "قادم"}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {cancelled && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
            تم إلغاء هذا الطلب. إذا كان لديك أي استفسار تواصل مع خدمة العملاء.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 font-extrabold text-ink-900">
            المنتجات ({data.items.length})
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image ?? ""}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg bg-slate-50 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 font-extrabold text-ink-900">ملخص الدفع</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">المجموع الفرعي</dt>
                <dd className="font-bold">{formatPrice(data.order.subtotal)}</dd>
              </div>
              {data.order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>الخصم</dt>
                  <dd className="font-bold">− {formatPrice(data.order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">الشحن</dt>
                <dd className="font-bold">
                  {data.order.shipping === 0 ? "مجاني" : formatPrice(data.order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2">
                <dt className="font-extrabold">الإجمالي</dt>
                <dd className="text-lg font-black text-rose-600">{formatPrice(data.order.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              طريقة الدفع:{" "}
              {data.order.paymentMethod === "card" ? "بطاقة ائتمانية / مدى" : "الدفع عند الاستلام"}
            </p>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-extrabold text-ink-900">
              <PinIcon width={17} height={17} className="text-gold-600" />
              عنوان التوصيل
            </h2>
            <p className="text-sm font-bold text-ink-900">{data.order.fullName}</p>
            <p className="mt-1 text-sm text-slate-600">{data.order.address}</p>
            <p className="text-sm text-slate-600">{data.order.city}</p>
            <p className="mt-1 text-sm text-slate-600" dir="ltr">
              {data.order.phone}
            </p>
            {data.order.email && (
              <p className="text-sm text-slate-600" dir="ltr">
                {data.order.email}
              </p>
            )}
            {data.order.notes && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                ملاحظات: {data.order.notes}
              </p>
            )}
          </div>

          <div className="card space-y-2 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-extrabold text-ink-900">
              <BoxIcon width={17} height={17} className="text-gold-600" />
              خدمة ما بعد البيع
            </p>
            <p className="flex items-center gap-2">
              <TruckIcon width={16} height={16} className="text-emerald-600" /> تتبع الشحنة من صفحة
              الطلب
            </p>
            <p className="flex items-center gap-2">
              <ShieldIcon width={16} height={16} className="text-emerald-600" /> ضمان استرداد خلال 15
              يومًا
            </p>
            <Link href="/products" className="block pt-1 text-sm font-bold text-gold-600 hover:underline">
              تسوّق منتجات أخرى ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
