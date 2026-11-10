"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Info, LoaderCircle } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

export type ProductFormValues = {
  title: string;
  brand: string;
  categoryId: string;
  price: string;
  listPrice: string;
  stock: string;
  description: string;
  features: string;
  images: string;
  isDeal: boolean;
  express: boolean;
};

const lines = (value: string) =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export default function ProductForm({
  productId,
  initial,
  categories,
}: {
  productId?: number;
  initial: ProductFormValues;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    const body = {
      title: v.title,
      brand: v.brand,
      categoryId: v.categoryId,
      price: v.price,
      listPrice: v.listPrice,
      stock: v.stock,
      description: v.description,
      features: lines(v.features),
      images: lines(v.images),
      isDeal: v.isDeal,
      express: v.express,
    };
    const res = productId
      ? await api(`/api/admin/products/${productId}`, "PATCH", body)
      : await api("/api/admin/products", "POST", body);
    if (!res.ok) {
      setBusy(false);
      setErrors(res.fields ?? {});
      setFormError(res.error);
      return;
    }
    toast({ message: productId ? "حُفظت التعديلات." : "أُضيف المنتج إلى المتجر." });
    router.push("/admin/products");
    router.refresh();
  }

  const err = (key: string) =>
    errors[key] ? (
      <p id={`pf-${key}-err`} className="field-error">
        {errors[key]}
      </p>
    ) : null;
  const aria = (key: string) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `pf-${key}-err` : undefined,
  });

  const previews = lines(v.images).slice(0, 6);

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card space-y-4 p-4 sm:p-6">
        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-deal/40 px-3.5 py-3 text-sm font-medium text-deal"
          >
            <Info size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="pf-title" className="label">
            اسم المنتج
          </label>
          <input
            id="pf-title"
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={160}
            className="field"
            {...aria("title")}
          />
          {err("title")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-brand" className="label">
              الماركة <span className="font-normal text-muted">(اختياري)</span>
            </label>
            <input
              id="pf-brand"
              value={v.brand}
              onChange={(e) => set("brand", e.target.value)}
              maxLength={60}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="pf-category" className="label">
              القسم
            </label>
            <select
              id="pf-category"
              value={v.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="field"
              {...aria("categoryId")}
            >
              <option value="">اختر القسم</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err("categoryId")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pf-price" className="label">
              السعر (ر.س)
            </label>
            <input
              id="pf-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              dir="ltr"
              value={v.price}
              onChange={(e) => set("price", e.target.value)}
              className="field text-end"
              {...aria("price")}
            />
            {err("price")}
          </div>
          <div>
            <label htmlFor="pf-list" className="label">
              السعر قبل الخصم <span className="font-normal text-muted">(اختياري)</span>
            </label>
            <input
              id="pf-list"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              dir="ltr"
              value={v.listPrice}
              onChange={(e) => set("listPrice", e.target.value)}
              className="field text-end"
              {...aria("listPrice")}
            />
            {err("listPrice")}
          </div>
          <div>
            <label htmlFor="pf-stock" className="label">
              الكمية في المخزون
            </label>
            <input
              id="pf-stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              dir="ltr"
              value={v.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="field text-end"
              {...aria("stock")}
            />
            {err("stock")}
          </div>
        </div>

        <div>
          <label htmlFor="pf-desc" className="label">
            الوصف
          </label>
          <textarea
            id="pf-desc"
            rows={4}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={4000}
            className="field resize-y"
          />
        </div>

        <div>
          <label htmlFor="pf-features" className="label">
            أبرز المزايا
          </label>
          <textarea
            id="pf-features"
            rows={4}
            value={v.features}
            onChange={(e) => set("features", e.target.value)}
            aria-describedby="pf-features-hint"
            className="field resize-y"
          />
          <p id="pf-features-hint" className="mt-1.5 text-xs text-muted">
            ميزة واحدة في كل سطر (حتى 8).
          </p>
        </div>

        <div>
          <label htmlFor="pf-images" className="label">
            روابط الصور
          </label>
          <textarea
            id="pf-images"
            rows={3}
            dir="ltr"
            value={v.images}
            onChange={(e) => set("images", e.target.value)}
            aria-invalid={Boolean(errors.images)}
            aria-describedby={errors.images ? "pf-images-err" : "pf-images-hint"}
            placeholder="https://example.com/photo.jpg"
            className="field resize-y text-start text-sm"
          />
          {errors.images ? (
            err("images")
          ) : (
            <p id="pf-images-hint" className="mt-1.5 text-xs text-muted">
              رابط واحد في كل سطر (حتى 6). الصورة الأولى هي الرئيسية.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <div className="card space-y-3 p-4 sm:p-5">
          <h3 className="text-base font-bold text-ink-950">خيارات العرض</h3>
          <label className="flex items-start gap-3 text-sm text-body">
            <input
              type="checkbox"
              checked={v.express}
              onChange={(e) => set("express", e.target.checked)}
              className="mt-0.5 size-4 accent-ink-900"
            />
            <span>
              <span className="font-semibold text-ink-950">توصيل إكسبرس</span>
              <span className="block text-xs text-muted">يظهر بشارة إكسبرس ويُسلَّم في اليوم التالي.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-body">
            <input
              type="checkbox"
              checked={v.isDeal}
              onChange={(e) => set("isDeal", e.target.checked)}
              className="mt-0.5 size-4 accent-ink-900"
            />
            <span>
              <span className="font-semibold text-ink-950">ضمن عروض اليوم</span>
              <span className="block text-xs text-muted">يظهر في قسم العروض بالصفحة الرئيسية.</span>
            </span>
          </label>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="text-base font-bold text-ink-950">معاينة الصور</h3>
          {previews.length === 0 ? (
            <p className="mt-2 text-sm text-muted">ستظهر الصور هنا عند إضافة روابطها.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <li key={`${src}-${i}`}>
                  <SmartImage
                    src={src}
                    alt={`الصورة ${i + 1}`}
                    className="aspect-square w-full rounded-lg bg-paper object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className="btn btn-primary flex-1 py-3">
            {busy && <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />}
            {productId ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
          <Link href="/admin/products" className="btn btn-outline py-3">
            إلغاء
          </Link>
        </div>
      </div>
    </form>
  );
}
