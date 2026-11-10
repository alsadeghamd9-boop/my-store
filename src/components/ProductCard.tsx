"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { Price, Stars } from "@/components/ui";
import { CartIcon, HeartIcon, TruckIcon } from "@/components/icons";
import { discountPercent } from "@/lib/format";

export interface CardProduct {
  id: number;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  stock: number;
  sold?: number;
  brand?: string | null;
  fastShipping?: boolean;
}

export default function ProductCard({
  product,
  compact = false,
  priority = false,
}: {
  product: CardProduct;
  compact?: boolean;
  priority?: boolean;
}) {
  const { add, wishlist, toggleWishlist } = useCart();
  const [busy, setBusy] = useState(false);
  const inWishlist = wishlist.includes(product.id);
  const off = discountPercent(product.price, product.oldPrice);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;

  async function handleAdd() {
    setBusy(true);
    await add(product.id, 1);
    setBusy(false);
  }

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-slate-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.title}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {off > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-black text-white shadow">
            خصم {off}%
          </span>
        )}
        {out && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-900/85 py-1 text-center text-xs font-bold text-white">
            نفدت الكمية
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => void toggleWishlist(product.id)}
        aria-label={inWishlist ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        className={`absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${
          inWishlist
            ? "bg-rose-500 text-white"
            : "bg-white/85 text-slate-500 hover:bg-white hover:text-rose-500"
        }`}
      >
        <HeartIcon width={16} height={16} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && !compact && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {product.brand}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition hover:text-gold-600"
        >
          {product.title}
        </Link>

        <Stars value={product.rating} count={product.reviewCount} />

        <div className="mt-auto">
          <Price value={product.price} old={product.oldPrice} size={compact ? "sm" : "md"} />

          {typeof product.sold === "number" && product.sold > 500 && (
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              +{product.sold.toLocaleString("ar-SA-u-nu-latn")} تم شراؤه
            </p>
          )}

          <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <TruckIcon width={14} height={14} />
            {product.fastShipping ? "توصيل خلال 24 ساعة" : "توصيل خلال 2-4 أيام"}
          </p>

          {low && (
            <p className="mt-1 text-[11px] font-bold text-rose-600">
              باقي {product.stock} قطع فقط!
            </p>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || out}
            className="btn-gold mt-2 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CartIcon width={16} height={16} />
            {busy ? "جارٍ الإضافة..." : out ? "غير متوفر" : "أضف إلى السلة"}
          </button>
        </div>
      </div>
    </article>
  );
}
