"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { CloseIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";

interface Row {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  image: string;
  featured: boolean;
  fastShipping: boolean;
  categoryName: string | null;
  categorySlug: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FormState {
  id?: number;
  title: string;
  slug: string;
  brand: string;
  categorySlug: string;
  price: string;
  oldPrice: string;
  stock: string;
  image: string;
  gallery: string;
  bullets: string;
  description: string;
  featured: boolean;
  fastShipping: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  brand: "",
  categorySlug: "",
  price: "",
  oldPrice: "",
  stock: "10",
  image: "",
  gallery: "",
  bullets: "",
  description: "",
  featured: false,
  fastShipping: true,
};

export default function AdminProducts({ initialLowStock = false }: { initialLowStock?: boolean }) {
  const { notify } = useCart();
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lowStock, setLowStock] = useState(initialLowStock);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "12", page: String(page) });
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items: Row[] = data.items ?? [];
        setRows(lowStock ? items.filter((item) => item.stock < 20) : items);
        setPages(data.pages ?? 1);
        setTotal(data.total ?? 0);
        if (categories.length === 0) setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [categories.length, lowStock, page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openEdit(id: number) {
    setBusy(true);
    const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
    setBusy(false);
    if (!res.ok) {
      notify("تعذّر تحميل بيانات المنتج", "error");
      return;
    }
    const data = await res.json();
    const product = data.product;
    const matched = categories.find((category) => category.id === product.categoryId);
    setForm({
      id: product.id,
      title: product.title,
      slug: product.slug,
      brand: product.brand ?? "",
      categorySlug: matched?.slug ?? "",
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      stock: String(product.stock),
      image: product.image,
      gallery: (product.gallery ?? []).join("\n"),
      bullets: (product.bullets ?? []).join("\n"),
      description: product.description ?? "",
      featured: Boolean(product.featured),
      fastShipping: Boolean(product.fastShipping),
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    const payload = {
      title: form.title,
      slug: form.slug,
      brand: form.brand,
      categorySlug: form.categorySlug,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stock: Number(form.stock),
      image: form.image,
      gallery: form.gallery,
      bullets: form.bullets,
      description: form.description,
      featured: form.featured,
      fastShipping: form.fastShipping,
    };
    const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "تعذّر الحفظ", "error");
      return;
    }
    notify(form.id ? "تم تحديث المنتج" : "تمت إضافة المنتج");
    setForm(null);
    await load();
  }

  async function remove(row: Row) {
    if (!window.confirm(`حذف المنتج «${row.title}» نهائيًا؟`)) return;
    setBusy(true);
    const res = await fetch(`/api/products/${row.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      notify("تم حذف المنتج", "info");
      await load();
    } else {
      notify("تعذّر الحذف", "error");
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="ابحث باسم المنتج أو الماركة..."
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold-500"
        />
        <button
          type="button"
          onClick={() => setLowStock((value) => !value)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            lowStock ? "bg-amber-500 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          المخزون المنخفض فقط
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY_FORM })}
          className="btn-gold flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-extrabold"
        >
          <PlusIcon width={16} height={16} />
          منتج جديد
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
          <h2 className="font-extrabold text-ink-900">
            المنتجات <span className="text-slate-400">({total})</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold disabled:opacity-40"
            >
              السابق
            </button>
            <span className="text-xs font-bold text-slate-500">
              صفحة {page} من {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              disabled={page >= pages}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="skeleton h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">لا توجد منتجات مطابقة.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-right font-bold">المنتج</th>
                  <th className="px-3 py-2 text-right font-bold">القسم</th>
                  <th className="px-3 py-2 text-right font-bold">السعر</th>
                  <th className="px-3 py-2 text-right font-bold">المخزون</th>
                  <th className="px-3 py-2 text-right font-bold">المبيعات</th>
                  <th className="px-3 py-2 text-right font-bold">التقييم</th>
                  <th className="px-3 py-2 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.image} alt="" className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                        <div className="min-w-0">
                          <a href={`/product/${row.slug}`} className="line-clamp-1 font-bold hover:text-gold-600">
                            {row.title}
                          </a>
                          <span className="text-[11px] text-slate-400">{row.brand ?? "بدون ماركة"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{row.categoryName ?? "—"}</td>
                    <td className="px-3 py-2 font-black">{formatPrice(row.price)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                          row.stock === 0
                            ? "bg-rose-100 text-rose-700"
                            : row.stock < 20
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {row.stock}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs font-bold text-slate-600">{row.sold}</td>
                    <td className="px-3 py-2 text-xs font-bold text-slate-600" dir="ltr">
                      ★ {row.rating.toFixed(1)} ({row.reviewCount})
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void openEdit(row.id)}
                          className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-100"
                          aria-label="تعديل"
                        >
                          <EditIcon width={15} height={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                          aria-label="حذف"
                        >
                          <TrashIcon width={15} height={15} />
                        </button>
                        {row.featured && (
                          <span className="rounded-full bg-gold-200 px-2 py-0.5 text-[10px] font-black text-ink-900">
                            مميز
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="card my-8 w-full max-w-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink-900">
                {form.id ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">اسم المنتج *</span>
                <input
                  value={form.title}
                  onChange={(event) => set("title", event.target.value)}
                  required
                  className={inputClass}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">الرابط (slug)</span>
                <input
                  value={form.slug}
                  onChange={(event) => set("slug", event.target.value)}
                  className={inputClass}
                  dir="ltr"
                  placeholder="يُنشأ تلقائيًا إذا تُرك فارغًا"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">الماركة</span>
                <input value={form.brand} onChange={(event) => set("brand", event.target.value)} className={inputClass} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">القسم</span>
                <select
                  value={form.categorySlug}
                  onChange={(event) => set("categorySlug", event.target.value)}
                  className={inputClass}
                >
                  <option value="">بدون قسم</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-600">السعر *</span>
                  <input
                    value={form.price}
                    onChange={(event) => set("price", event.target.value)}
                    required
                    inputMode="decimal"
                    className={inputClass}
                    dir="ltr"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-600">قبل الخصم</span>
                  <input
                    value={form.oldPrice}
                    onChange={(event) => set("oldPrice", event.target.value)}
                    inputMode="decimal"
                    className={inputClass}
                    dir="ltr"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-600">المخزون</span>
                  <input
                    value={form.stock}
                    onChange={(event) => set("stock", event.target.value)}
                    inputMode="numeric"
                    className={inputClass}
                    dir="ltr"
                  />
                </label>
              </div>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">رابط الصورة الرئيسية</span>
                <input
                  value={form.image}
                  onChange={(event) => set("image", event.target.value)}
                  className={inputClass}
                  dir="ltr"
                  placeholder="https://..."
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">صور إضافية (رابط لكل سطر)</span>
                <textarea
                  value={form.gallery}
                  onChange={(event) => set("gallery", event.target.value)}
                  rows={2}
                  className={inputClass}
                  dir="ltr"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">الوصف</span>
                <textarea
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">المزايا (سطر لكل ميزة)</span>
                <textarea
                  value={form.bullets}
                  onChange={(event) => set("bullets", event.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => set("featured", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-gold-500"
                />
                منتج مميز
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.fastShipping}
                  onChange={(event) => set("fastShipping", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-gold-500"
                />
                شحن سريع (24 ساعة)
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button type="submit" disabled={busy} className="btn-gold rounded-full px-6 py-2 text-sm font-extrabold disabled:opacity-60">
                {busy ? "جارٍ الحفظ..." : form.id ? "حفظ التعديلات" : "إضافة المنتج"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40";
