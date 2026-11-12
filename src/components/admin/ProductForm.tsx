"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

export type ProductFormValues = {
  title: string; brand: string; categoryId: string; price: string; listPrice: string;
  stock: string; description: string; features: string; images: string[]; isDeal: boolean; express: boolean;
};
export default function ProductForm({ productId, initial, categories }: {
  productId?: number; initial: ProductFormValues; categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || uploading) return;
    setBusy(true); setFormError(""); setErrors({});
    const body = { ...v, features: v.features.split("\n").map((item) => item.trim()).filter(Boolean) };
    const res = await api(productId ? `/api/admin/products/${productId}` : "/api/admin/products", productId ? "PATCH" : "POST", body);
    setBusy(false);
    if (!res.ok) { setErrors(res.fields ?? {}); setFormError(res.error); return; }
    toast({ message: productId ? "حُفظت التعديلات." : "أُضيف المنتج إلى المتجر." });
    router.push("/admin/products"); router.refresh();
  }
  const err = (key: string) => errors[key] ? <p className="field-error">{errors[key]}</p> : null;
  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card space-y-5 p-5 sm:p-6">
        {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-deal">{formError}</p>}
        <div><label htmlFor="title" className="label">اسم المنتج</label><input id="title" required minLength={3} maxLength={160} className="field" value={v.title} onChange={(e) => set("title", e.target.value)} />{err("title")}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="brand" className="label">العلامة التجارية <span className="text-muted">(اختياري)</span></label><input id="brand" maxLength={60} className="field" value={v.brand} onChange={(e) => set("brand", e.target.value)} /></div>
          <div><label htmlFor="category" className="label">القسم</label><select id="category" required className="field" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">اختر القسم</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{err("categoryId")}{categories.length === 0 && <Link href="/admin/categories" className="mt-2 block text-sm text-ink-700 underline">أضف قسماً أولاً</Link>}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="price" className="label">السعر (ج.س)</label><input id="price" type="number" min="0.01" max="20000000" step="0.01" required dir="ltr" className="field text-end" value={v.price} onChange={(e) => set("price", e.target.value)} />{err("price")}</div>
          <div><label htmlFor="listPrice" className="label">السعر قبل الخصم</label><input id="listPrice" type="number" min="0.01" max="20000000" step="0.01" dir="ltr" className="field text-end" value={v.listPrice} onChange={(e) => set("listPrice", e.target.value)} />{err("listPrice")}</div>
          <div><label htmlFor="stock" className="label">المخزون</label><input id="stock" type="number" min="0" max="100000" step="1" required dir="ltr" className="field text-end" value={v.stock} onChange={(e) => set("stock", e.target.value)} />{err("stock")}</div>
        </div>
        <div><label htmlFor="description" className="label">وصف المنتج</label><textarea id="description" rows={5} maxLength={4000} className="field" value={v.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><label htmlFor="features" className="label">أبرز المزايا <span className="text-muted">(كل ميزة في سطر)</span></label><textarea id="features" rows={4} className="field" value={v.features} onChange={(e) => set("features", e.target.value)} /></div>
        <div className="flex flex-wrap gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={v.isDeal} onChange={(e) => set("isDeal", e.target.checked)} /> عرض خاص</label><label className="flex items-center gap-2"><input type="checkbox" checked={v.express} onChange={(e) => set("express", e.target.checked)} /> منتج مميز</label></div>
      </div>
      <aside className="space-y-5">
        <div className="card p-5"><h3 className="mb-1 text-base font-bold">صور المنتج</h3><p className="mb-4 text-sm text-muted">ارفع صورة واحدة على الأقل من جهازك.</p><ImageUploader images={v.images} onChange={(images) => set("images", images)} onBusyChange={setUploading} />{err("images")}</div>
        <div className="card flex flex-col gap-3 p-5"><button type="submit" disabled={busy || uploading || categories.length === 0} className="btn btn-dark w-full">{busy && <LoaderCircle size={16} className="animate-spin" />}{productId ? "حفظ التغييرات" : "إضافة المنتج"}</button><Link href="/admin/products" className="btn btn-outline w-full">إلغاء</Link></div>
      </aside>
    </form>
  );
}
