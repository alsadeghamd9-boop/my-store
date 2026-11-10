import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import Stars from "@/components/Stars";
import { isSortKey, type SortKey } from "@/lib/constants";
import { itemsLabel } from "@/lib/format";
import { getCategories, listProducts } from "@/lib/queries";

type SP = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Whole-riyal price filter value from the URL. */
function riyals(v: string) {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n) : undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  if (q) return { title: `نتائج البحث عن «${q.slice(0, 60)}»` };
  const cats = await getCategories();
  const category = cats.find((c) => c.slug === first(sp.category));
  return { title: category ? category.name : "كل المنتجات" };
}

function Option({
  href,
  active,
  round = false,
  children,
}: {
  href: string;
  active: boolean;
  round?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${
        active ? "font-semibold text-ink-950" : "text-body hover:bg-paper"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-[18px] shrink-0 place-items-center border ${
          round ? "rounded-full" : "rounded-[5px]"
        } ${active ? "border-ink-900 bg-ink-900 text-white" : "border-[#8fa19e] bg-white"}`}
      >
        {active && <Check size={12} strokeWidth={3.5} />}
      </span>
      {children}
    </Link>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cats = await getCategories();

  const q = first(sp.q).trim().slice(0, 80);
  const category = cats.find((c) => c.slug === first(sp.category));
  const min = riyals(first(sp.min));
  const max = riyals(first(sp.max));
  const ratingRaw = Number(first(sp.rating));
  const rating = ratingRaw === 3 || ratingRaw === 4 ? ratingRaw : undefined;
  const express = first(sp.express) === "1";
  const deal = first(sp.deal) === "1";
  const sortRaw = first(sp.sort);
  const sort: SortKey = isSortKey(sortRaw) ? sortRaw : "featured";
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);

  const result = await listProducts({
    q: q || undefined,
    categoryId: category?.id,
    min: min != null ? min * 100 : undefined,
    max: max != null ? max * 100 : undefined,
    rating,
    express,
    deal,
    sort,
    page,
    pageSize: 12,
  });

  // Canonical set of active params; every filter link is derived from it.
  const current: Record<string, string> = {};
  if (q) current.q = q;
  if (category) current.category = category.slug;
  if (min != null) current.min = String(min);
  if (max != null) current.max = String(max);
  if (rating) current.rating = String(rating);
  if (express) current.express = "1";
  if (deal) current.deal = "1";
  if (sort !== "featured") current.sort = sort;

  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(current);
    for (const [k, v] of Object.entries(changes)) {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    return s ? `/search?${s}` : "/search";
  };

  if (page > result.pages) redirect(href({ page: result.pages > 1 ? String(result.pages) : undefined }));

  const heading = q
    ? `نتائج البحث عن «${q}»`
    : category
      ? category.name
      : deal
        ? "عروض اليوم"
        : express
          ? "منتجات إكسبرس"
          : "كل المنتجات";

  const chips: { label: string; href: string }[] = [];
  if (q) chips.push({ label: `بحث: ${q}`, href: href({ q: undefined }) });
  if (category) chips.push({ label: category.name, href: href({ category: undefined }) });
  if (min != null || max != null) {
    const label =
      min != null && max != null
        ? `${min} – ${max} ر.س`
        : min != null
          ? `من ${min} ر.س`
          : `حتى ${max} ر.س`;
    chips.push({ label, href: href({ min: undefined, max: undefined }) });
  }
  if (rating) chips.push({ label: `${rating} نجوم فأكثر`, href: href({ rating: undefined }) });
  if (express) chips.push({ label: "إكسبرس", href: href({ express: undefined }) });
  if (deal) chips.push({ label: "عروض اليوم", href: href({ deal: undefined }) });

  const filters = (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-bold text-ink-950">القسم</h3>
        <ul>
          <li>
            <Option href={href({ category: undefined })} active={!category} round>
              كل الأقسام
            </Option>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Option href={href({ category: c.slug })} active={category?.id === c.id} round>
                {c.name}
              </Option>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-ink-950">السعر (ر.س)</h3>
        <form key={`${min ?? ""}-${max ?? ""}`} action="/search" className="flex items-end gap-2">
          {Object.entries(current)
            .filter(([k]) => k !== "min" && k !== "max")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <label className="min-w-0 flex-1 text-xs text-muted">
            من
            <input
              type="number"
              name="min"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={min ?? ""}
              className="field mt-1 px-2.5 py-2 text-sm"
            />
          </label>
          <label className="min-w-0 flex-1 text-xs text-muted">
            إلى
            <input
              type="number"
              name="max"
              min={0}
              step={1}
              inputMode="numeric"
              defaultValue={max ?? ""}
              className="field mt-1 px-2.5 py-2 text-sm"
            />
          </label>
          <button type="submit" className="btn btn-outline px-3.5 py-2">
            تطبيق
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-ink-950">تقييم العملاء</h3>
        <ul>
          {[4, 3].map((n) => (
            <li key={n}>
              <Option
                href={href({ rating: rating === n ? undefined : String(n) })}
                active={rating === n}
              >
                <Stars value={n} size={15} />
                <span>فأكثر</span>
              </Option>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-ink-950">التوصيل والعروض</h3>
        <ul>
          <li>
            <Option href={href({ express: express ? undefined : "1" })} active={express}>
              توصيل إكسبرس (اليوم التالي)
            </Option>
          </li>
          <li>
            <Option href={href({ deal: deal ? undefined : "1" })} active={deal}>
              عروض اليوم فقط
            </Option>
          </li>
        </ul>
      </section>
    </div>
  );

  return (
    <div className="container-page py-5">
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside aria-label="تصفية النتائج" className="hidden lg:block">
          <div className="card sticky top-4 p-4">{filters}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-ink-950">{heading}</h1>
              <p className="mt-1 text-sm text-muted">
                {result.total === 0 ? "لا توجد منتجات مطابقة" : itemsLabel(result.total)}
                {category && !q ? ` · ${category.tagline}` : ""}
              </p>
            </div>
            <SortSelect value={sort} params={current} />
          </div>

          <details className="card mt-4 lg:hidden">
            <summary className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink-950">
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} aria-hidden="true" />
                تصفية النتائج
              </span>
              {chips.length > 0 && (
                <span className="rounded-full bg-ink-900 px-2 py-0.5 text-xs text-white">
                  {chips.length}
                </span>
              )}
            </summary>
            <div className="border-t border-line p-4">{filters}</div>
          </details>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="عوامل التصفية المفعّلة">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={chip.href}
                    aria-label={`إزالة التصفية: ${chip.label}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 ps-3 pe-2 text-sm text-body hover:border-ink-700"
                  >
                    {chip.label}
                    <X size={14} aria-hidden="true" className="text-muted" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={sort !== "featured" ? `/search?sort=${sort}` : "/search"}
                  className="rounded-md px-1 text-sm font-semibold text-ink-700 hover:underline"
                >
                  مسح الكل
                </Link>
              </li>
            </ul>
          )}

          {result.items.length === 0 ? (
            <div className="card mt-5 flex flex-col items-center px-6 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-paper text-ink-700">
                <Search size={26} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink-950">لم نجد ما يطابق بحثك</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                جرّب كلمات أقصر أو أعمّ، أو أزل بعض عوامل التصفية. يمكنك أيضاً تصفّح الأقسام من
                الشريط العلوي.
              </p>
              <Link href="/search" className="btn btn-dark mt-6">
                عرض كل المنتجات
              </Link>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {result.items.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}

          {result.pages > 1 && (
            <nav aria-label="صفحات النتائج" className="mt-8 flex items-center justify-center gap-1.5">
              {page > 1 ? (
                <Link
                  href={href({ page: page - 1 > 1 ? String(page - 1) : undefined })}
                  className="btn btn-outline px-3.5"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                  السابق
                </Link>
              ) : null}
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href({ page: n > 1 ? String(n) : undefined })}
                  aria-current={n === page ? "page" : undefined}
                  aria-label={`الصفحة ${n}`}
                  className={`grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm font-semibold ${
                    n === page
                      ? "bg-ink-900 text-white"
                      : "border border-line bg-white text-body hover:border-ink-700"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {page < result.pages ? (
                <Link href={href({ page: String(page + 1) })} className="btn btn-outline px-3.5">
                  التالي
                  <ChevronLeft size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
