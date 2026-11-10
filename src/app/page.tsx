import Link from "next/link";
import { Banknote, ChevronLeft, RotateCcw, ShieldCheck, Truck, Zap } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import SectionHeader from "@/components/SectionHeader";
import SmartImage from "@/components/SmartImage";
import { getCategories, listProducts, type ProductCardData } from "@/lib/queries";

const BENEFITS = [
  { icon: Truck, title: "توصيل سريع", text: "منتجات إكسبرس تصلك في اليوم التالي" },
  { icon: Banknote, title: "الدفع عند الاستلام", text: "ادفع نقداً لحظة تسليم طلبك" },
  { icon: RotateCcw, title: "إرجاع خلال 15 يوماً", text: "للمنتجات غير المستخدمة بعبوتها" },
  { icon: ShieldCheck, title: "منتجات أصلية", text: "بضمان الوكيل أو ضمان المتجر" },
];

function ProductRail({ items }: { items: ProductCardData[] }) {
  return (
    <ul className="thin-scrollbar -mx-3 flex snap-x scroll-px-3 gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:scroll-px-0 sm:px-0">
      {items.map((p) => (
        <li key={p.id} className="w-[46vw] max-w-[230px] shrink-0 snap-start sm:w-[230px]">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

export default async function HomePage() {
  const [cats, deals, best, fresh] = await Promise.all([
    getCategories(),
    listProducts({ deal: true, pageSize: 10 }),
    listProducts({ sort: "featured", pageSize: 8 }),
    listProducts({ sort: "newest", pageSize: 10 }),
  ]);

  return (
    <div className="container-page space-y-10 py-4 sm:space-y-12 sm:py-6">
      <h1 className="sr-only">قافلة — تسوّق الإلكترونيات والأزياء ومستلزمات المنزل</h1>

      <HeroCarousel />

      <section aria-label="مزايا التسوق من قافلة">
        <ul className="card grid grid-cols-2 gap-x-3 gap-y-5 p-4 sm:p-5 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-100 text-ink-900">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-950">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-cats">
        <div className="mb-4">
          <h2 id="home-cats" className="text-xl font-bold text-ink-950 sm:text-2xl">
            تسوّق حسب القسم
          </h2>
        </div>
        <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
          {cats.map((c) => (
            <li key={c.id}>
              <Link
                href={`/search?category=${c.slug}`}
                className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-white p-1.5 pb-2.5 text-center transition-colors hover:border-ink-700 sm:p-2.5 sm:pb-3"
              >
                <span className="block w-full overflow-hidden rounded-xl bg-paper">
                  <SmartImage
                    src={c.image}
                    alt=""
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="text-[11px] leading-tight font-semibold text-ink-950 sm:text-sm">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {deals.items.length > 0 && (
        <section aria-label="عروض اليوم">
          <SectionHeader
            title="عروض اليوم"
            note="أسعار مخفّضة على منتجات مختارة"
            href="/search?deal=1"
            linkLabel="كل العروض"
          />
          <ProductRail items={deals.items} />
        </section>
      )}

      <section className="overflow-hidden rounded-3xl bg-ink-900 text-white">
        <div className="on-dark flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-saffron-500 text-ink-950">
              <Zap size={24} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">اطلب اليوم، ويصلك غداً</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-100 sm:text-base">
                المنتجات التي تحمل شارة «إكسبرس» جاهزة في مستودعاتنا وتُسلَّم في اليوم التالي داخل
                المدن الرئيسية.
              </p>
            </div>
          </div>
          <Link href="/search?express=1" className="btn btn-primary shrink-0 px-6 py-3">
            تصفّح منتجات إكسبرس
            <ChevronLeft size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="الأكثر مبيعاً">
        <SectionHeader title="الأكثر مبيعاً" href="/search" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {best.items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="وصل حديثاً">
        <SectionHeader title="وصل حديثاً" href="/search?sort=newest" />
        <ProductRail items={fresh.items} />
      </section>
    </div>
  );
}
