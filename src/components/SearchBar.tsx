"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";

interface Category {
  name: string;
  slug: string;
}

interface Suggestion {
  id: number;
  slug: string;
  title: string;
  price: number;
  image: string;
}

export default function SearchBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (term.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&perPage=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.items ?? []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    setOpen(false);
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (category) params.set("category", category);
    router.push(params.toString() ? `/products?${params.toString()}` : "/products");
  }

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={submit} className="flex h-10 overflow-hidden rounded-lg ring-gold-500 focus-within:ring-2">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="اختر القسم"
          className="hidden max-w-[130px] shrink-0 border-l border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-700 outline-none sm:block"
        >
          <option value="">كل الأقسام</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          type="search"
          placeholder="ابحث في سوق عن منتجات، ماركات، وأكثر..."
          className="min-w-0 flex-1 bg-white px-3 text-sm text-ink-900 outline-none placeholder:text-slate-400"
          aria-label="ابحث عن منتجات"
        />
        <button
          type="submit"
          className="grid w-12 shrink-0 place-items-center bg-gold-400 text-ink-900 transition hover:bg-gold-300"
          aria-label="بحث"
        >
          <SearchIcon width={20} height={20} />
        </button>
      </form>

      {open && term.trim().length >= 2 && (
        <div className="card absolute inset-x-0 top-11 z-50 max-h-[70vh] overflow-y-auto p-1 text-ink-900">
          {suggestions.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">لا توجد نتائج مطابقة لـ «{term}»</p>
          ) : (
            suggestions.map((item) => (
              <a
                key={item.id}
                href={`/product/${item.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-md bg-slate-100 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="block text-xs font-bold text-gold-600">{formatPrice(item.price)}</span>
                </span>
              </a>
            ))
          )}
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-ink-800 transition hover:bg-slate-200"
          >
            عرض كل النتائج لـ «{term}»
          </button>
        </div>
      )}
    </div>
  );
}
