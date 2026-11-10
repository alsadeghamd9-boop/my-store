"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Search } from "lucide-react";

type Suggestion = { slug: string; title: string; image: string; price: number };

export default function SearchBar({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const onSearch = pathname === "/search";
  const urlQ = onSearch ? (sp.get("q") ?? "") : "";
  const urlCategory = onSearch ? (sp.get("category") ?? "") : "";

  const [q, setQ] = useState(urlQ);
  const [category, setCategory] = useState(urlCategory);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const listId = useId();

  // Keep the box in sync when the shopper navigates (back button, filter links…).
  useEffect(() => {
    setQ(urlQ);
    setCategory(urlCategory);
    setOpen(false);
  }, [urlQ, urlCategory, pathname]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setActive(-1);
      } catch {
        // Suggestions are optional; a failed lookup just shows none.
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const query = params.toString();
    setOpen(false);
    router.push(query ? `/search?${query}` : "/search");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(`/product/${items[active].slug}`);
    }
  }

  const showList = open && items.length > 0;

  return (
    <form
      ref={formRef}
      role="search"
      action="/search"
      onSubmit={submit}
      className="on-light relative flex h-11 items-stretch rounded-full bg-white text-body focus-within:ring-2 focus-within:ring-saffron-400"
    >
      <label htmlFor={`${listId}-cat`} className="sr-only">
        ابحث داخل قسم
      </label>
      <select
        id={`${listId}-cat`}
        name="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="hidden max-w-40 rounded-s-full border-e border-line bg-paper ps-4 pe-2 text-sm text-body focus:outline-none sm:block"
      >
        <option value="">كل الأقسام</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <label htmlFor={`${listId}-q`} className="sr-only">
        ابحث في قافلة
      </label>
      <input
        id={`${listId}-q`}
        type="search"
        name="q"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
        placeholder="ابحث عن منتج أو ماركة أو قسم"
        className="min-w-0 flex-1 rounded-s-full bg-transparent px-4 text-[15px] text-body placeholder:text-muted focus:outline-none sm:rounded-none"
      />
      <button
        type="submit"
        aria-label="بحث"
        className="m-1 grid w-11 shrink-0 place-items-center rounded-full bg-saffron-500 text-ink-950 hover:bg-saffron-400"
      >
        <Search size={19} aria-hidden="true" />
      </button>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="اقتراحات البحث"
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_20px_50px_-12px_rgba(6,25,28,0.35)]"
        >
          {items.map((item, i) => (
            <li
              key={item.slug}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
            >
              <Link
                href={`/product/${item.slug}`}
                onClick={() => setOpen(false)}
                tabIndex={-1}
                className={`flex items-center gap-3 px-3 py-2 text-sm text-body ${
                  i === active ? "bg-paper" : "hover:bg-paper"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-lg bg-paper object-cover"
                />
                <span className="line-clamp-1 flex-1">{item.title}</span>
              </Link>
            </li>
          ))}
          <li role="presentation" className="mt-1 border-t border-line px-3 pt-2 pb-1">
            <button type="submit" className="text-sm font-semibold text-ink-700 hover:underline">
              عرض كل النتائج عن «{q.trim()}»
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
