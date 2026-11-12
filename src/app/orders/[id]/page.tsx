import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Banknote, Check, ChevronRight, CircleCheck, CircleX, MapPin } from "lucide-react";
import { OrderStatusBadge } from "@/components/Badges";
import CancelOrderButton from "@/components/CancelOrderButton";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { getDb } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_HINTS, STATUS_LABELS, isOrderStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { canAccessOrder } from "@/lib/order-access";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS, paymentProviderName } from "@/lib/payment-accounts";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const { id: rawId } = await params;
  const sp = await searchParams;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  await ensureSeeded();
  const user = await getCurrentUser();
  const [order] = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || !(await canAccessOrder(order, user))) notFound();

  const lines = await getDb().select({
      id: orderItems.id,
      title: orderItems.title,
      image: orderItems.image,
      price: orderItems.price,
      quantity: orderItems.quantity,
      slug: products.slug,
      active: products.active,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, id))
    .orderBy(orderItems.id);

  const status = isOrderStatus(order.status) ? order.status : "pending";
  const cancelled = status === "cancelled";
  const stepIndex = STEPS.indexOf(status as (typeof STEPS)[number]);
  const isOwner = order.userId === null || order.userId === user?.id;
  const canCancel = (status === "pending" || status === "processing") && isOwner;

  return (
    <div className="container-page py-5">
      <Link
        href={isOwner ? (order.userId === null ? "/" : "/orders") : "/admin/orders"}
        className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-ink-700 hover:underline"
      >
        <ChevronRight size={16} aria-hidden="true" />
        {isOwner ? (order.userId === null ? "العودة للمتجر" : "كل طلباتي") : "العودة إلى إدارة الطلبات"}
      </Link>

      {sp.placed === "1" && isOwner && !cancelled && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-express/30 bg-white p-4 sm:p-5"
        >
          <CircleCheck size={26} aria-hidden="true" className="mt-0.5 shrink-0 text-express" />
          <div>
            <p className="font-display text-lg font-bold text-ink-950">شكراً لك! استلمنا طلبك.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              طلبك قيد المراجعة. يمكنك متابعة حالته من هذه الصفحة. إجمالي الطلب <Money value={order.total} className="font-semibold text-body" />.
              {order.userId === null && " احتفظ بهذه الصفحة في نفس المتصفح لمتابعة طلبك."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold text-ink-950">
          طلب رقم <span dir="ltr">{order.number}</span>
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">تم الطلب في {formatDate(order.createdAt)}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="card p-4 sm:p-6" aria-labelledby="track-title">
            <h2 id="track-title" className="text-lg font-bold text-ink-950">
              حالة الطلب
            </h2>
            {cancelled ? (
              <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-body">
                <CircleX size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-deal" />
                {STATUS_HINTS.cancelled}
              </p>
            ) : (
              <>
                <ol className="mt-5 flex">
                  {STEPS.map((step, i) => {
                    const done = i < stepIndex || status === "delivered";
                    const current = i === stepIndex && status !== "delivered";
                    return (
                      <li
                        key={step}
                        aria-current={current ? "step" : undefined}
                        className="relative flex flex-1 flex-col items-center text-center"
                      >
                        {i > 0 && (
                          <span
                            aria-hidden="true"
                            className={`absolute end-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                              i <= stepIndex ? "bg-express" : "bg-line"
                            }`}
                          />
                        )}
                        <span
                          className={`relative z-[1] grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                            done
                              ? "bg-express text-white"
                              : current
                                ? "bg-saffron-500 text-ink-950 ring-4 ring-saffron-100"
                                : "border border-line bg-white text-muted"
                          }`}
                        >
                          {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
                        </span>
                        <span
                          className={`mt-2 px-1 text-xs sm:text-sm ${
                            done || current ? "font-semibold text-ink-950" : "text-muted"
                          }`}
                        >
                          {STATUS_LABELS[step]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed text-body">
                  {STATUS_HINTS[status]}
                </p>
              </>
            )}
            {canCancel && (
              <div className="mt-4 border-t border-line pt-4">
                <CancelOrderButton orderId={order.id} />
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="items-title">
            <h2 id="items-title" className="px-4 pt-4 text-lg font-bold text-ink-950 sm:px-6 sm:pt-6">
              المنتجات
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
                  <SmartImage
                    src={l.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl bg-paper object-cover sm:h-20 sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    {l.slug && l.active ? (
                      <Link
                        href={`/product/${l.slug}`}
                        className="line-clamp-2 rounded text-sm leading-snug font-medium text-body hover:text-ink-700 hover:underline"
                      >
                        {l.title}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm leading-snug font-medium text-body">
                        {l.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      الكمية: {l.quantity} · <Money value={l.price} /> للقطعة
                    </p>
                    {status === "delivered" && isOwner && l.slug && l.active && (
                      <Link
                        href={`/product/${l.slug}#reviews`}
                        className="mt-1 inline-block rounded text-xs font-semibold text-ink-700 hover:underline"
                      >
                        قيّم المنتج
                      </Link>
                    )}
                  </div>
                  <Money
                    value={l.price * l.quantity}
                    className="text-sm font-semibold text-ink-950"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <section className="card p-5" aria-labelledby="sum-title">
            <h2 id="sum-title" className="text-lg font-bold text-ink-950">
              ملخص الدفع
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">المجموع الفرعي</dt>
                <dd>
                  <Money value={order.subtotal} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">التوصيل</dt>
                <dd>
                  {order.shippingFee === 0 ? (
                    <span className="font-semibold text-express">مجاني</span>
                  ) : (
                    <Money value={order.shippingFee} />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-base">
                <dt className="font-bold text-ink-950">الإجمالي</dt>
                <dd>
                  <Money value={order.total} className="font-display font-bold text-ink-950" />
                </dd>
              </div>
            </dl>
            <p className="mt-4 flex items-center gap-2 text-sm text-body">
              <Banknote size={18} aria-hidden="true" className="shrink-0 text-ink-700" />
              {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
            {order.paymentProvider && <p className="mt-2 text-sm text-body">{paymentProviderName(order.paymentProvider)}</p>}
            {order.paymentReference && <p className="mt-2 text-sm text-muted">مرجع التحويل: {order.paymentReference}</p>}
            <p className="mt-2 text-xs text-muted">{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}{order.paymentMethod !== "cod" && " — يُراجع الدفع يدوياً."}</p>
          </section>

          <section className="card p-5" aria-labelledby="addr-title">
            <h2 id="addr-title" className="flex items-center gap-2 text-lg font-bold text-ink-950">
              <MapPin size={19} aria-hidden="true" />
              عنوان التوصيل
            </h2>
            <address className="mt-3 space-y-1 text-sm leading-relaxed text-body not-italic">
              <p className="font-semibold text-ink-950">{order.shipName}</p>
              <p>
                {order.shipStreet}، {order.shipDistrict}
              </p>
              <p>{[order.shipState, order.shipCity].filter(Boolean).join("، ")}</p>
              <p dir="ltr" className="text-end">
                {order.shipPhone}
              </p>
            </address>
            {order.notes && (
              <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm text-body">
                <span className="font-semibold">ملاحظات: </span>
                {order.notes}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
