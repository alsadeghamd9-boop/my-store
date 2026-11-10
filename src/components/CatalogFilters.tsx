"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CloseIcon, StarIcon } from "@/components/icons";

export interface FilterState {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sort?: string;
  page?: string;
  perPage?: string;
  inStock?: string;
}

interface CategoryOption {
  name: string;
  slug: string;
  count: number;
}

function buildQuery(state: FilterState): string {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value && value !== "" && value !== "relevance") params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function SortSelect({ state }: { state: FilterState }) {
  const router = useRouter();
  const options = [
    { value: "relevance", label: "الأكثر صلة" },
    { value: "bestselling", label: "الأكثر مبيعًا" },
    { value: "newest", label: "الأحدث" },
    { value: "price-asc", label: "السعر: من الأقل للأعلى" },
    { value: "price-desc", label: "السعر: من الأعلى للأقل" },
    { value: "rating", label: "الأعلى تقييمًا" },
    { value: "discount", label: "أعلى خصم" },
  ];

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-bold text-slate-600">ترتيب حسب:</span>
      <select
        value={state.sort ?? "relevance"}
        onChange={(event) =>
          router.push(buildQuery({ ...state, sort: event.target.value, page: undefined }))
        }
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CatalogFilters({
  categories,
  brands,
  state,
}: {
  categories: CategoryOption[];
  brands: string[];
  state: FilterState;
}) {
  const router = useRouter();
  const [min, setMin] = useState(state.minPrice ?? "");
  const [max, setMax] = useState(state.maxPrice ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (patch: Partial<FilterState>) =>
    router.push(buildQuery({ ...state, ...patch, page: undefined }));

  const priceRanges = [
    { label: "أقل من 100 ر.س", min: "", max: "100" },
    { label: "100 - 500 ر.س", min: "100", max: "500" },
    { label: "500 - 1500 ر.س", min: "500", max: "1500" },
    { label: "أكثر من 1500 ر.س", min: "1500", max: "" },
  ];

  const hasActive =
    state.category || state.brand || state.minPrice || state.maxPrice || state.minRating || state.inStock;

  const body = (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-extrabold text-ink-900">القسم</h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => update({ category: undefined })}
              className={`w-full rounded-lg px-2 py-1.5 text-right text-sm transition ${
                !state.category
                  ? "bg-gold-200/50 font-bold text-ink-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              كل الأقسام
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                onClick={() => update({ category: category.slug })}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-right text-sm transition ${
                  state.category === category.slug
                    ? "bg-gold-200/50 font-bold text-ink-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{category.name}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[11px] font-bold text-slate-500">
                  {category.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-ink-900">السعر</h3>
        <ul className="mb-3 space-y-1">
          {priceRanges.map((range) => {
            const active = state.minPrice === range.min && state.maxPrice === range.max;
            return (
              <li key={range.label}>
                <button
                  type="button"
                  onClick={() => update({ minPrice: range.min || undefined, maxPrice: range.max || undefined })}
                  className={`w-full rounded-lg px-2 py-1.5 text-right text-sm transition ${
                    active ? "bg-gold-200/50 font-bold text-ink-900" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {range.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <input
            value={min}
            onChange={(event) => setMin(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="من"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
          />
          <span className="text-slate-400">—</span>
          <input
            value={max}
            onChange={(event) => setMax(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="إلى"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold-500"
          />
        </div>
        <button
          type="button"
          onClick={() => update({ minPrice: min || undefined, maxPrice: max || undefined })}
          className="mt-2 w-full rounded-lg bg-ink-900 py-2 text-sm font-bold text-white transition hover:bg-ink-800"
        >
          تطبيق السعر
        </button>
      </section>

      {brands.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-extrabold text-ink-900">الماركة</h3>
          <ul className="max-h-52 space-y-1 overflow-y-auto thin-scrollbar">
            {brands.map((brand) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={state.brand === brand}
                    onChange={(event) => update({ brand: event.target.checked ? brand : undefined })}
                    className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400"
                  />
                  <span className="truncate">{brand}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-extrabold text-ink-900">تقييم العملاء</h3>
        <ul className="space-y-1">
          {[4, 3, 2].map((rating) => (
            <li key={rating}>
              <button
                type="button"
                onClick={() => update({ minRating: String(rating) })}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  state.minRating === String(rating)
                    ? "bg-gold-200/50 font-bold text-ink-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, index) => (
                    <StarIcon key={index} width={13} height={13} className="text-gold-500" />
                  ))}
                </span>
                فأعلى
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={state.inStock === "1"}
            onChange={(event) => update({ inStock: event.target.checked ? "1" : undefined })}
            className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400"
          />
          المتوفر فقط
        </label>
      </section>

      {hasActive && (
        <button
          type="button"
          onClick={() => update({ category: undefined, brand: undefined, minPrice: undefined, maxPrice: undefined, minRating: undefined, inStock: undefined })}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <CloseIcon width={14} height={14} />
          إزالة كل الفلاتر
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 lg:hidden"
      >
        <span>الفلاتر والتصنيف</span>
        <ChevronDown width={18} height={18} />
      </button>

      <aside className="card hidden h-fit p-4 lg:block lg:sticky lg:top-32">{body}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="إغلاق"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">تصفية النتائج</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
