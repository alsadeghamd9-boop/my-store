import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Banknote, Check, ChevronLeft, RotateCcw, Truck } from "lucide-react";
import { ExpressBadge } from "@/components/Badges";
import BuyBox from "@/components/BuyBox";
import Price, { Money } from "@/components/Price";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ReviewForm from "@/components/ReviewForm";
import SectionHeader from "@/components/SectionHeader";
import Stars from "@/components/Stars";
import { getCurrentUser } from "@/lib/auth";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { discountPercent, formatCount, formatDate, formatDay } from "@/lib/format";
import {
  getProductBySlug,
  getProductReviews,
  getRatingHistogram,
  getRelatedProducts,
  getWishlistIds,
} from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const row = await getProductBySlug(slug);
  if (!row) return { title: "المنتج غير موجود" };
  return { title: row.product.title, description: row.product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const row = await getProductBySlug(slug);
  if (!row) notFound();
  const p = row.product;

  const [user, wishlist, reviewList, histogram, related] = await Promise.all([
    getCurrentUser(),
    getWishlistIds(),
    getProductReviews(p.id),
    getRatingHistogram(p.id),
    getRelatedProducts(p.categoryId, p.id),
  ]);

  const off = discountPercent(p.price, p.listPrice);
  const inStock = p.stock > 0;
  const mine = user ? reviewList.find((r) => r.userId === user.id) : undefined;
  const freeShipping = p.price >= FREE_SHIPPING_THRESHOLD;
  const tomorrow = new Date(Date.now() + 86400_000);

  return (
    <div className="container-page py-5">
      <nav aria-label="مسار التصفح" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/" className="rounded hover:text-ink-950 hover:underline">
              الرئيسية
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronLeft size={14} />
          </li>
          <li>
            <Link
              href={`/search?category=${row.categorySlug}`}
              className="rounded hover:text-ink-950 hover:underline"
            >
              {row.categoryName}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_330px]">
        <div className="lg:row-span-2 xl:row-span-1">
          <ProductGallery images={p.images} title={p.title} />
        </div>

        <div>
          {p.brand && (
            <Link
              href={`/search?q=${encodeURIComponent(p.brand)}`}
              className="rounded text-sm font-semibold text-ink-700 hover:underline"
            >
              {p.brand}
            </Link>
          )}
          <h1 className="mt-1 text-2xl leading-snug font-bold text-ink-950 sm:text-[1.7rem]">
            {p.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {p.ratingCount > 0 ? (
              <>
                <span className="font-semibold text-ink-950" dir="ltr">
                  {p.ratingAvg.toFixed(1)}
                </span>
                <Stars value={p.ratingAvg} size={17} />
                <a href="#reviews" className="rounded text-ink-700 hover:underline">
                  {formatCount(p.ratingCount)} تقييم
                </a>
              </>
            ) : (
              <a href="#reviews" className="rounded text-ink-700 hover:underline">
                كن أول من يقيّم هذا المنتج
              </a>
            )}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              {off > 0 && (
                <span className="rounded-md bg-deal px-2 py-1 text-sm font-bold text-white">
                  خصم {off}%
                </span>
              )}
              <Price value={p.price} size="lg" />
            </div>
            {off > 0 && p.listPrice && (
              <p className="mt-2 text-sm text-muted">
                السعر قبل الخصم: <Money value={p.listPrice} className="line-through" /> · توفّر{" "}
                <Money value={p.listPrice - p.price} className="font-semibold text-deal" />
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted">السعر شامل ضريبة القيمة المضافة.</p>
          </div>

          <p className="mt-4 leading-relaxed text-body">{p.description}</p>

          {p.features.length > 0 && (
            <div className="mt-5">
              <h2 className="text-base font-bold text-ink-950">أبرز المزايا</h2>
              <ul className="mt-2.5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                    <Check size={17} aria-hidden="true" className="mt-1 shrink-0 text-express" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside aria-label="خيارات الشراء" className="xl:sticky xl:top-4 xl:self-start">
          <div className="card p-4 sm:p-5">
            <Price value={p.price} size="md" />

            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Truck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-700" />
                <span>
                  {p.express ? (
                    <>
                      <ExpressBadge className="me-1.5" />
                      يصلك غداً، <span className="font-semibold">{formatDay(tomorrow)}</span>
                    </>
                  ) : (
                    <>التوصيل خلال 2–4 أيام عمل</>
                  )}
                  <span className="mt-0.5 block text-muted">
                    {freeShipping ? (
                      "توصيل مجاني لهذا المنتج"
                    ) : (
                      <>
                        رسوم التوصيل <Money value={SHIPPING_FEE} /> · مجاني للطلبات فوق{" "}
                        <Money value={FREE_SHIPPING_THRESHOLD} />
                      </>
                    )}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Banknote size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-700" />
                الدفع عند الاستلام متاح
              </li>
              <li className="flex items-start gap-2.5">
                <RotateCcw size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-700" />
                إرجاع خلال 15 يوماً من الاستلام
              </li>
            </ul>

            <p
              className={`mt-4 text-base font-bold ${
                !inStock ? "text-deal" : p.stock <= 5 ? "text-deal" : "text-express"
              }`}
            >
              {!inStock ? "غير متوفر حالياً" : p.stock <= 5 ? `بقي ${p.stock} فقط — اطلب قريباً` : "متوفر في المخزون"}
            </p>

            <div className="mt-4">
              <BuyBox productId={p.id} stock={p.stock} saved={wishlist.has(p.id)} />
            </div>

            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              يُباع ويُشحن بواسطة قافلة.
            </p>
          </div>
        </aside>
      </div>

      {p.specs.length > 0 && (
        <section className="mt-10" aria-labelledby="specs-title">
          <h2 id="specs-title" className="text-xl font-bold text-ink-950">
            المواصفات
          </h2>
          <dl className="card mt-4 max-w-3xl divide-y divide-line overflow-hidden text-sm">
            {p.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-[minmax(110px,35%)_1fr]">
                <dt className="bg-paper/70 px-4 py-3 font-semibold text-ink-950">{s.label}</dt>
                <dd className="px-4 py-3 text-body">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section id="reviews" className="mt-12 scroll-mt-4" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="text-xl font-bold text-ink-950">
          تقييمات العملاء
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="card p-5">
              {p.ratingCount > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-4xl font-bold text-ink-950" dir="ltr">
                      {p.ratingAvg.toFixed(1)}
                    </span>
                    <div>
                      <Stars value={p.ratingAvg} size={20} />
                      <p className="mt-1 text-sm text-muted">
                        من {formatCount(p.ratingCount)} تقييم
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const pct = Math.round((histogram[n] / p.ratingCount) * 100);
                      return (
                        <li key={n} className="flex items-center gap-3 text-sm">
                          <span className="w-14 shrink-0 text-muted">{n} نجوم</span>
                          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                            <span
                              className="block h-full rounded-full bg-saffron-500"
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="w-10 shrink-0 text-end text-muted" dir="ltr">
                            {pct}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted">
                  لا توجد تقييمات لهذا المنتج بعد. شاركنا تجربتك لتساعد غيرك على الاختيار.
                </p>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-base font-bold text-ink-950">
                {mine ? "تقييمك" : "اكتب تقييماً"}
              </h3>
              {user ? (
                <div className="mt-3">
                  <ReviewForm
                    key={mine ? `${mine.id}-${mine.rating}` : "new"}
                    productId={p.id}
                    existing={
                      mine ? { rating: mine.rating, title: mine.title, body: mine.body } : undefined
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    سجّل الدخول لتشارك رأيك في هذا المنتج.
                  </p>
                  <Link
                    href={`/login?next=${encodeURIComponent(`/product/${p.slug}#reviews`)}`}
                    className="btn btn-outline mt-3"
                  >
                    تسجيل الدخول
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            {reviewList.length === 0 ? (
              <div className="card p-8 text-center text-sm text-muted">
                ستظهر تقييمات العملاء هنا فور نشرها.
              </div>
            ) : (
              <ul className="space-y-3">
                {reviewList.map((r) => (
                  <li key={r.id} className="card p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-900">
                        {r.userName.trim().charAt(0)}
                      </span>
                      <span className="text-sm font-semibold text-ink-950">{r.userName}</span>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-express">
                          <BadgeCheck size={14} aria-hidden="true" />
                          مشترٍ موثّق
                        </span>
                      )}
                      <span className="ms-auto text-xs text-muted">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Stars value={r.rating} size={15} />
                      {r.title && <span className="text-sm font-bold text-ink-950">{r.title}</span>}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-body">{r.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12" aria-label="منتجات مشابهة">
          <SectionHeader
            title="منتجات مشابهة"
            href={`/search?category=${row.categorySlug}`}
            linkLabel={`كل ${row.categoryName}`}
          />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
