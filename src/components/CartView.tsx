"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { EmptyState } from "@/components/ui";
import { MinusIcon, PlusIcon, ReturnIcon, ShieldIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/format";

export default function CartView() {
  const { items, totals, ready, promo, setQuantity, remove, clear, applyPromo, toggleWishlist } =
    useCart();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (!ready) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="card skeleton h-32 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="سلتك فارغة"
        description="لم تقم بإضافة أي منتجات بعد. تصفح أقسام المتجر واكتشف آلاف المنتجات بأسعار منافسة."
        action={
          <Link href="/products" className="btn-gold rounded-full px-8 py-2.5 text-sm font-extrabold">
            ابدأ التسوق
          </Link>
        }
      />
    );
  }

  async function handlePromo() {
    if (!code.trim()) return;
    setChecking(true);
    await applyPromo(code.trim());
    setChecking(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <div className="card p-4">
          <h1 className="text-xl font-black text-ink-900 sm:text-2xl">
            سلة التسوق{" "}
            <span className="text-sm font-bold text-slate-500">
              ({items.reduce((sum, item) => sum + item.quantity, 0)} منتج)
            </span>
          </h1>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={remaining > 0 ? "text-slate-600" : "text-emerald-700"}>
                {remaining > 0
                  ? `أضف ${formatPrice(remaining)} للحصول على شحن مجاني`
                  : "🎉 حصلت على شحن مجاني!"}
              </span>
              <span className="text-slate-400">{formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {items.map((item) => (
          <article key={item.id} className="card flex gap-3 p-3 sm:p-4">
            <Link
              href={`/product/${item.slug}`}
              className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-50 sm:h-28 sm:w-28"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/product/${item.slug}`}
                  className="line-clamp-2 text-sm font-bold text-ink-900 hover:text-gold-600 sm:text-base"
                >
                  {item.title}
                </Link>
                <span className="shrink-0 text-base font-black text-ink-900 sm:text-lg">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>

              {item.brand && <span className="text-xs text-slate-500">الماركة: {item.brand}</span>}

              <span className="mt-1 text-xs font-bold text-emerald-700">
                {item.stock > 5 ? "متوفر" : `متبقي ${item.stock} فقط`}
              </span>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-white">
                  <button
                    type="button"
                    onClick={() => void setQuantity(item.productId, item.quantity - 1)}
                    className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-slate-100"
                    aria-label="تقليل"
                  >
                    <MinusIcon width={14} height={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-black" dir="ltr">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => void setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= Math.min(item.stock, 99)}
                    className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-slate-100 disabled:opacity-40"
                    aria-label="زيادة"
                  >
                    <PlusIcon width={14} height={14} />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => void remove(item.productId)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    <TrashIcon width={14} height={14} />
                    حذف
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => void toggleWishlist(item.productId)}
                    className="rounded-lg px-2 py-1.5 font-bold text-sky-700 transition hover:bg-sky-50"
                  >
                    نقل إلى المفضلة
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => void clear()}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          تفريغ السلة بالكامل
        </button>
      </div>

      <aside className="card h-fit p-4 lg:sticky lg:top-32">
        <h2 className="text-lg font-extrabold text-ink-900">ملخص الطلب</h2>

        <dl className="mt-3 space-y-2 text-sm">
          <Row label={`المجموع الفرعي (${items.length} منتج)`} value={formatPrice(totals.subtotal)} />
          {totals.discount > 0 && (
            <Row label="الخصم" value={`− ${formatPrice(totals.discount)}`} tone="text-emerald-700" />
          )}
          <Row
            label="الشحن"
            value={totals.shipping === 0 ? "مجاني" : formatPrice(totals.shipping)}
            tone={totals.shipping === 0 ? "text-emerald-700" : undefined}
          />
          <div className="border-t border-dashed border-slate-200 pt-2">
            <Row label="الإجمالي" value={formatPrice(totals.total)} bold />
          </div>
        </dl>

        <div className="mt-4">
          <label className="text-xs font-bold text-slate-600">كود الخصم</label>
          <div className="mt-1 flex gap-2">
            <input
              value={promo || code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="WELCOME10"
              dir="ltr"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold uppercase outline-none focus:border-gold-500"
            />
            <button
              type="button"
              onClick={handlePromo}
              disabled={checking}
              className="shrink-0 rounded-lg bg-ink-900 px-4 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
            >
              {checking ? "..." : "تطبيق"}
            </button>
          </div>
          {totals.promoValid && (
            <p className="mt-1.5 text-xs font-bold text-emerald-700">✓ {totals.promoLabel}</p>
          )}
        </div>

        <Link
          href="/checkout"
          className="btn-orange mt-4 block rounded-full py-3 text-center text-sm font-extrabold"
        >
          المتابعة إلى الدفع
        </Link>
        <Link
          href="/products"
          className="mt-2 block rounded-full border border-slate-300 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          مواصلة التسوق
        </Link>

        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <li className="flex items-center gap-1.5">
            <ShieldIcon width={14} height={14} className="text-emerald-600" /> دفع آمن 100%
          </li>
          <li className="flex items-center gap-1.5">
            <ReturnIcon width={14} height={14} className="text-emerald-600" /> إرجاع مجاني خلال 15 يومًا
          </li>
          <li className="flex items-center gap-1.5">
            <TruckIcon width={14} height={14} className="text-emerald-600" /> توصيل لجميع مدن المملكة
          </li>
        </ul>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={bold ? "text-base font-extrabold text-ink-900" : "text-slate-600"}>{label}</dt>
      <dd className={`${bold ? "text-lg font-black text-rose-600" : "font-bold"} ${tone ?? "text-ink-900"}`}>
        {value}
      </dd>
    </div>
  );
}
