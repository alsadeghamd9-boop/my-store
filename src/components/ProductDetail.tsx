"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { Price, Stars } from "@/components/ui";
import {
  CartIcon,
  CheckIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  ReturnIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/icons";
import { discountPercent, formatPrice } from "@/lib/format";

export interface DetailProduct {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  description: string;
  bullets: string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  fastShipping: boolean;
  categoryName: string | null;
  categorySlug: string | null;
}

export default function ProductDetail({ product }: { product: DetailProduct }) {
  const router = useRouter();
  const { add, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const gallery = product.gallery.length > 0 ? product.gallery : [product.image];
  const off = discountPercent(product.price, product.oldPrice);
  const inWishlist = wishlist.includes(product.id);
  const out = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(product.stock, 10));

  const deliveryDate = new Date(Date.now() + (product.fastShipping ? 1 : 3) * 86400000);
  const deliveryText = deliveryDate.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function addToCart() {
    setBusy("cart");
    await add(product.id, quantity);
    setBusy(null);
  }

  async function buyNow() {
    setBusy("buy");
    await add(product.id, quantity);
    setBusy(null);
    router.push("/checkout");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
      {/* Gallery */}
      <div className="flex gap-3">
        <div className="hidden w-16 shrink-0 flex-col gap-2 sm:flex">
          {gallery.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onMouseEnter={() => setActiveImage(index)}
              onClick={() => setActiveImage(index)}
              className={`overflow-hidden rounded-lg border-2 bg-white transition ${
                index === activeImage ? "border-gold-500" : "border-slate-200 hover:border-slate-300"
              }`}
              aria-label={`صورة ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-16 w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="card relative flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[activeImage]}
            alt={product.title}
            className="h-[320px] w-full bg-slate-50 object-cover sm:h-[440px]"
          />
          {off > 0 && (
            <span className="absolute right-3 top-3 rounded-lg bg-rose-600 px-2.5 py-1 text-sm font-black text-white shadow">
              خصم {off}%
            </span>
          )}
          <div className="flex gap-2 overflow-x-auto p-2 sm:hidden">
            {gallery.map((src, index) => (
              <button
                key={`m-${src}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`shrink-0 overflow-hidden rounded-md border-2 ${
                  index === activeImage ? "border-gold-500" : "border-slate-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-14 w-14 object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0">
        {product.brand && (
          <a
            href={`/products?brand=${encodeURIComponent(product.brand)}`}
            className="text-sm font-bold text-sky-700 hover:text-gold-600 hover:underline"
          >
            زيارة متجر {product.brand}
          </a>
        )}
        <h1 className="mt-1 text-xl font-extrabold leading-snug text-ink-900 sm:text-2xl">
          {product.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <a href="#reviews" className="flex items-center gap-2 hover:underline">
            <Stars value={product.rating} size={16} showValue />
            <span className="font-semibold text-sky-700">
              {product.reviewCount.toLocaleString("ar-SA-u-nu-latn")} تقييم
            </span>
          </a>
          <span className="text-slate-400">|</span>
          <span className="font-semibold text-slate-600">
            {product.sold.toLocaleString("ar-SA-u-nu-latn")} عملية شراء
          </span>
          {product.categoryName && (
            <>
              <span className="text-slate-400">|</span>
              <a
                href={`/products?category=${product.categorySlug}`}
                className="font-semibold text-sky-700 hover:underline"
              >
                {product.categoryName}
              </a>
            </>
          )}
        </div>

        <div className="mt-4 border-y border-slate-200 py-4">
          <Price value={product.price} old={product.oldPrice} size="lg" />
          <p className="mt-1 text-xs text-slate-500">شامل ضريبة القيمة المضافة</p>
          {product.oldPrice && product.oldPrice > product.price && (
            <p className="mt-2 text-sm font-bold text-emerald-700">
              توفّر {formatPrice(product.oldPrice - product.price)} عند الشراء اليوم
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-2">
          {(product.bullets.length > 0
            ? product.bullets
            : [product.description]
          )
            .filter(Boolean)
            .slice(0, 6)
            .map((bullet, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{bullet}</span>
              </li>
            ))}
        </ul>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Feature icon={<TruckIcon width={18} height={18} />} title="شحن سريع" text={deliveryText} />
          <Feature icon={<ReturnIcon width={18} height={18} />} title="إرجاع مجاني" text="خلال 15 يومًا" />
          <Feature icon={<ShieldIcon width={18} height={18} />} title="ضمان أصلي" text="منتج 100% أصلي" />
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          <h2 className="mb-1 font-extrabold text-ink-900">وصف المنتج</h2>
          {product.description}
        </div>
      </div>

      {/* Buy box */}
      <aside className="card h-fit p-4 lg:sticky lg:top-32">
        <Price value={product.price} old={product.oldPrice} size="lg" />

        <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <TruckIcon width={16} height={16} className="text-gold-600" />
          توصيل مجاني للطلبات فوق 300 ر.س
        </p>
        <p className="mt-1 text-xs text-slate-500">
          وصل خلال <span className="font-bold text-ink-900">{deliveryText}</span> إذا طلبت الآن
        </p>

        <p
          className={`mt-3 text-base font-extrabold ${
            out ? "text-rose-600" : product.stock <= 5 ? "text-amber-600" : "text-emerald-700"
          }`}
        >
          {out
            ? "نفدت الكمية"
            : product.stock <= 5
              ? `متبقي ${product.stock} قطع فقط`
              : "متوفر في المخزون"}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2">
          <span className="text-sm font-bold text-slate-600">الكمية</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white transition hover:bg-slate-50 disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="تقليل الكمية"
            >
              <MinusIcon width={14} height={14} />
            </button>
            <span className="w-10 text-center font-black" dir="ltr">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white transition hover:bg-slate-50 disabled:opacity-40"
              disabled={quantity >= maxQty}
              aria-label="زيادة الكمية"
            >
              <PlusIcon width={14} height={14} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={busy !== null || out}
          className="btn-gold mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CartIcon width={18} height={18} />
          {busy === "cart" ? "جارٍ الإضافة..." : "أضف إلى السلة"}
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={busy !== null || out}
          className="btn-orange mt-2 w-full rounded-full py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "buy" ? "جارٍ التحويل..." : "اشترِ الآن"}
        </button>

        <button
          type="button"
          onClick={() => void toggleWishlist(product.id)}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-bold transition ${
            inWishlist
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <HeartIcon width={17} height={17} />
          {inWishlist ? "في قائمتي المفضلة" : "أضف إلى المفضلة"}
        </button>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <ShieldIcon width={14} height={14} className="text-emerald-600" />
            معاملات آمنة ومشفّرة
          </p>
          <p className="flex items-center gap-1.5">
            <ReturnIcon width={14} height={14} className="text-emerald-600" />
            إرجاع مجاني خلال 15 يومًا
          </p>
          <p>
            يُشحن ويُباع بواسطة: <span className="font-bold text-ink-900">سوق.سا</span>
          </p>
        </div>
      </aside>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-200/50 text-gold-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold text-ink-900">{title}</span>
        <span className="block truncate text-[11px] text-slate-500">{text}</span>
      </span>
    </div>
  );
}
