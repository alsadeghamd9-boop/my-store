
import Link from "next/link";
import CatalogFilters, { SortSelect, type FilterState } from "@/components/CatalogFilters";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui";
import { listBrands, listCategories, searchProducts } from "@/db/queries";
import { toNumber } from "@/lib/api";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const pick = (key: string): string | undefined => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const q = pick("q") ?? "";
  const category = pick("category");
  const perPage = Math.min(48, Math.max(4, toNumber(pick("perPage")) ?? 12));
  const page = Math.max(1, toNumber(pick("page")) ?? 1);

  const state: FilterState = {
    q: q || undefined,
    category,
    brand: pick("brand"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    minRating: pick("minRating"),
    sort: pick("sort"),
    inStock: pick("inStock"),
    perPage: String(perPage),
    page: String(page),
  };

  const [{ items, total }, allCategories, brands] = await Promise.all([
    searchProducts({
      q: state.q,
      category: state.category,
      brand: state.brand,
      minPrice: toNumber(state.minPrice),
      maxPrice: toNumber(state.maxPrice),
      minRating: toNumber(state.minRating),
      inStock: state.inStock === "1",
      sort: state.sort,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    listCategories(),
    listBrands(state.category),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const activeCategory = allCategories.find((item) => item.slug === category);

  const basePath = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...state, page: String(nextPage) }).forEach(([key, value]) => {
      if (value && value !== "" && value !== "relevance") params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const heading = q
    ? `نتائج البحث عن «${q}»`
    : (activeCategory?.name ?? "كل المنتجات");

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-gold-600">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gold-600">
          المنتجات
        </Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="font-bold text-ink-800">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink-900">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total.toLocaleString("ar-SA-u-nu-latn")} منتج
            {activeCategory?.tagline ? ` — ${activeCategory.tagline}` : ""}
          </p>
        </div>
        <SortSelect state={state} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <CatalogFilters categories={allCategories} brands={brands} state={state} />
        </div>

        <div>
          {items.length === 0 ? (
            <EmptyState
              title="لا توجد نتائج مطابقة"
              description="جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر للعثور على ما تريد."
              action={
                <Link href="/products" className="btn-gold rounded-full px-6 py-2 text-sm font-bold">
                  عرض كل المنتجات
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          )}

          <Pagination page={Math.min(page, pages)} pages={pages} basePath={basePath} />
        </div>
      </div>
    </div>
  );
}
