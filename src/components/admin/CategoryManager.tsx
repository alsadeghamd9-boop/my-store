"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Pencil, Plus } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteButton from "@/components/admin/DeleteButton";
import SmartImage from "@/components/SmartImage";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

type Category = { id: number; name: string; tagline: string; image: string; slug: string };
const blank = { name: "", tagline: "", image: "" };
export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<number | null>(null);
  const [values, setValues] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  function reset() { setEditing(null); setValues(blank); setError(""); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || uploading) return;
    setBusy(true); setError("");
    const response = await api(editing ? `/api/admin/categories/${editing}` : "/api/admin/categories", editing ? "PATCH" : "POST", values);
    setBusy(false);
    if (!response.ok) { setError(response.error); return; }
    toast({ message: editing ? "حُفظ القسم." : "أُضيف القسم." });
    reset(); router.refresh();
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
      <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-line p-5"><h2 className="text-lg font-bold">الأقسام <span className="text-sm font-normal text-muted">({categories.length})</span></h2><FolderOpen size={19} className="text-ink-700" /></div>
        {categories.length === 0 ? <p className="p-8 text-center text-sm text-muted">لا توجد أقسام بعد. أضف أول قسم للمتجر.</p> : <ul className="divide-y divide-line">{categories.map((category) => <li key={category.id} className="flex flex-wrap items-center gap-3 p-4">
          <SmartImage src={category.image} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="font-semibold">{category.name}</p><p className="text-sm text-muted">{category.tagline || "بدون وصف"}</p></div>
          <button type="button" onClick={() => { setEditing(category.id); setValues({ name: category.name, tagline: category.tagline, image: category.image }); setError(""); }} className="flex items-center gap-1 text-sm font-semibold text-ink-700 hover:underline"><Pencil size={14} /> تعديل</button>
          <DeleteButton url={`/api/admin/categories/${category.id}`} label="حذف" confirmation="هل تريد حذف هذا القسم؟ يجب نقل أو حذف منتجاته أولاً." />
        </li>)}</ul>}
      </section>
      <form onSubmit={submit} className="card h-fit space-y-4 p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={19} />{editing ? "تعديل القسم" : "إضافة قسم"}</h2>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-deal">{error}</p>}
        <div><label htmlFor="category-name" className="label">اسم القسم</label><input id="category-name" className="field" required minLength={2} maxLength={80} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></div>
        <div><label htmlFor="category-tagline" className="label">وصف مختصر (اختياري)</label><input id="category-tagline" className="field" maxLength={140} value={values.tagline} onChange={(e) => setValues({ ...values, tagline: e.target.value })} /></div>
        <div><span className="label">صورة القسم (اختياري)</span><ImageUploader limit={1} images={values.image ? [values.image] : []} onChange={(images) => setValues((previous) => ({ ...previous, image: images[0] ?? "" }))} onBusyChange={setUploading} /></div>
        <button disabled={busy || uploading} className="btn btn-dark w-full">{busy ? "جارٍ الحفظ..." : editing ? "حفظ التغييرات" : "إضافة القسم"}</button>
        {editing && <button type="button" onClick={reset} className="btn btn-outline w-full">إلغاء التعديل</button>}
      </form>
    </div>
  );
}
