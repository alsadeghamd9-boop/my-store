import Link from "next/link";
import { getHomeData } from "@/db/queries";
import HeroCarousel, { type Slide } from "@/components/HeroCarousel";
import ProductRail from "@/components/ProductRail";
import ProductCard from "@/components/ProductCard";
import CountdownTimer from "@/components/CountdownTimer";
import { SectionHeading, Stars } from "@/components/ui";
import { SparkIcon, TruckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "bg-gradient-to-l from-ink-950 via-indigo-900 to-sky-800",
  "bg-gradient-to-l from-rose-900 via-orange-800 to-amber-600",
  "bg-gradient-to-l from-emerald-900 via-teal-800 to-cyan-700",
  "bg-gradient-to-l from-violet-900 via-fuchsia-800 to-rose-700",
];

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getHomeData>> | null = null;
  let error = false;

  try {
    data = await getHomeData();
  } catch {
    error = true;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-black text-ink-900">تعذّر تحميل المتجر</h1>
        <p className="mt-3 text-slate-600">
          لم نتمكن من الاتصال بقاعدة البيانات. سيتم إنشاء الجداول وبذر المنتجات تلقائيًا عند أول
          تشغيل للخادم — أعد تحميل الصفحة بعد لحظات.
        </p>
        <Link href="/" className="btn-gold mt-6 inline-block rounded-full px-6 py-2.5 font-bold">
          إعادة المحاولة
        </Link>
      </div>
    );
  }

  const heroPool = [...data.featured, ...data.deals, ...data.bestSellers];
  const slides: Slide[] = heroPool.slice(0, 4).map((product, index) => ({
    id: product.slug,
    eyebrow: index % 2 === 0 ? "عرض محدود" : "الأكثر طلبًا",
    title: product.title,
    description:
      product.oldPrice && product.oldPrice > product.price
        ? `السعر الآن ${formatPrice(product.price)} بدلًا من ${formatPrice(product.oldPrice)} — وفّر حتى ${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% لفترة محدودة.`
        : `متوفر الآن مع شحن سريع وتقييم ${product.rating.toFixed(1)} من ${product.reviewCount.toLocaleString("ar-SA-u-nu-latn")} عميل.`,
    cta: "تسوّق الآن",
    href: `/product/${product.slug}`,
    image: product.image,
    gradient: GRADIENTS[index % GRADIENTS.length],
  }));

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-3 py-4 sm:px-4 sm:py-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <HeroCarousel slides={slides} />

        <aside className="card flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-ink-900">صفقات تنتهي قريبًا</h2>
            <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-600">
              حصرية
            </span>
          </div>
          <CountdownTimer hoursFromNow={9} />
          <ul className="mt-4 flex-1 space-y-3">
            {data.deals.slice(0, 4).map((product) => (
              <li key={product.id}>
                <Link href={`/product/${product.slug}`} className="group flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg bg-slate-50 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-ink-900 transition group-hover:text-gold-600">
                      {product.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <Stars value={product.rating} size={12} />
                      <span className="text-sm font-extrabold text-rose-600">
                        {formatPrice(product.price)}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/products?sort=discount"
            className="btn-orange mt-4 rounded-full py-2 text-center text-sm font-extrabold"
          >
            شاهد كل العروض
          </Link>
        </aside>
      </section>

      <section>
        <SectionHeading
          title="تسوّق حسب القسم"
          subtitle="آلاف المنتجات في ستة أقسام رئيسية"
          href="/products"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="card group relative h-32 overflow-hidden sm:h-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={category.image ?? ""}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                <span className="block text-sm font-extrabold">{category.name}</span>
                <span className="block text-[11px] text-white/70">{category.tagline}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
              <SparkIcon width={22} height={22} className="text-gold-500" />
              عروض اليوم
            </h2>
            <p className="mt-1 text-sm text-slate-500">خصومات حقيقية على منتجات مختارة</p>
          </div>
          <CountdownTimer hoursFromNow={20} label="تنتهي خلال" />
        </div>
        <ProductRail products={data.deals} />
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-ink-950 via-ink-800 to-gold-600 px-6 py-8 text-white sm:px-10">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
            <TruckIcon width={15} height={15} />
            عرض التوصيل
          </span>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">شحن مجاني لكل طلب فوق 300 ر.س</h2>
          <p className="mt-2 text-sm text-white/80">
            استخدم كود <span className="rounded bg-white/20 px-2 py-0.5 font-black">WELCOME10</span>{" "}
            واحصل على خصم 10% على أول طلب، أو{" "}
            <span className="rounded bg-white/20 px-2 py-0.5 font-black">FREESHIP</span> لشحن مجاني
            بدون حد أدنى.
          </p>
          <Link
            href="/products?sort=bestselling"
            className="btn-gold mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-extrabold"
          >
            ابدأ التسوق الآن
          </Link>
        </div>
        <span className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      </section>

      <section>
        <SectionHeading
          title="الأكثر مبيعًا هذا الأسبوع"
          subtitle="اختيارات عملائنا المفضلة"
          href="/products?sort=bestselling"
        />
        <ProductRail products={data.bestSellers} />
      </section>

      <section>
        <SectionHeading
          title="وصل حديثًا"
          subtitle="أحدث ما أضفناه إلى المتجر"
          href="/products?sort=newest"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.newArrivals.slice(0, 6).map((product) => (
            <ProductRailItem key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <SectionHeading
          title="مختارات لك"
          subtitle="منتجات مميزة بجودة عالية وأسعار منافسة"
          href="/products?perPage=24"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.featured.map((product) => (
            <ProductRailItem key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductRailItem({ product }: { product: Parameters<typeof ProductCard>[0]["product"] }) {
  return <ProductCard product={product} />;
}
