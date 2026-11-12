"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Banknote, Building2, CheckCircle2, LoaderCircle, MapPin, Smartphone } from "lucide-react";
import { api } from "@/lib/client";
import { SUDAN_STATES } from "@/lib/constants";
import { BANK_ACCOUNTS, WALLET_ACCOUNTS } from "@/lib/payment-accounts";
import { normalizePhone } from "@/lib/phone";

type Defaults = { name: string; phone: string; state: string; city: string; district: string; street: string };
type Method = "cod" | "bank" | "wallet";
export default function CheckoutForm({ defaults, summary }: { defaults: Defaults; summary: ReactNode }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...defaults, notes: "", paymentReference: "" });
  const [method, setMethod] = useState<Method>("cod");
  const [provider, setProvider] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const accounts = method === "bank" ? BANK_ACCOUNTS : method === "wallet" ? WALLET_ACCOUNTS : [];
  const selected = accounts.find((account) => account.id === provider);
  const set = (key: keyof typeof values, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const fieldError = (key: string) => errors[key] ? <p className="field-error">{errors[key]}</p> : null;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const fields: Record<string, string> = {};
    if (!normalizePhone(values.phone)) fields.phone = "اكتب رقم هاتف سودانياً صحيحاً.";
    if (method !== "cod" && !provider) fields.paymentProvider = method === "bank" ? "اختر البنك." : "اختر المحفظة.";
    if (Object.keys(fields).length) { setErrors(fields); return; }
    setBusy(true); setError(""); setErrors({});
    const result = await api<{ id: number }>("/api/orders", "POST", { ...values, paymentMethod: method, paymentProvider: provider });
    if (!result.ok) { setBusy(false); setErrors(result.fields ?? {}); setError(result.error); return; }
    router.push(`/orders/${result.data.id}?placed=1`);
    router.refresh();
  }
  function changeMethod(next: Method) { setMethod(next); setProvider(""); setErrors({}); }
  return <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
    <div className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-deal/30 bg-white p-4 text-sm text-deal">{error} <Link href="/cart" className="underline">العودة للسلة</Link></div>}
      <section className="card p-5 sm:p-7"><h2 className="flex items-center gap-2 text-lg font-bold"><span className="grid size-9 place-items-center rounded-full bg-saffron-100 text-ink-900"><MapPin size={18} /></span> عنوان التوصيل</h2><p className="mt-2 text-sm text-muted">نوصل طلباتك إلى جميع ولايات السودان.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="co-name">الاسم الكامل</label><input id="co-name" className="field" required minLength={3} maxLength={80} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />{fieldError("name")}</div>
          <div><label className="label" htmlFor="co-phone">رقم الهاتف السوداني</label><input id="co-phone" className="field text-end" required type="tel" dir="ltr" autoComplete="tel" placeholder="0912345678" value={values.phone} onChange={(e) => set("phone", e.target.value)} />{fieldError("phone")}</div>
          <div><label className="label" htmlFor="co-state">الولاية</label><select id="co-state" className="field" required value={values.state} onChange={(e) => set("state", e.target.value)}><option value="">اختر الولاية</option>{SUDAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select>{fieldError("state")}</div>
          <div><label className="label" htmlFor="co-city">المدينة أو المحلية</label><input id="co-city" className="field" required minLength={2} maxLength={80} placeholder="مثال: ود مدني" value={values.city} onChange={(e) => set("city", e.target.value)} />{fieldError("city")}</div>
          <div><label className="label" htmlFor="co-district">الحي أو المنطقة</label><input id="co-district" className="field" required minLength={2} maxLength={80} value={values.district} onChange={(e) => set("district", e.target.value)} />{fieldError("district")}</div>
          <div><label className="label" htmlFor="co-street">العنوان التفصيلي</label><input id="co-street" className="field" required minLength={4} maxLength={160} autoComplete="street-address" value={values.street} onChange={(e) => set("street", e.target.value)} />{fieldError("street")}</div>
          <div className="sm:col-span-2"><label className="label" htmlFor="co-notes">ملاحظات للتوصيل (اختياري)</label><textarea id="co-notes" className="field" rows={2} maxLength={300} value={values.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
      </section>
      <fieldset className="card p-5 sm:p-7"><legend className="sr-only">طريقة الدفع</legend><h2 className="flex items-center gap-2 text-lg font-bold"><span className="grid size-9 place-items-center rounded-full bg-saffron-100 text-ink-900"><Banknote size={18} /></span> طريقة الدفع</h2><p className="mt-2 text-sm text-muted">اختر الطريقة المناسبة ليك.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{([
          ["cod", "الدفع عند الاستلام", Banknote, "ادفع عند وصول الطلب"], ["bank", "تحويل بنكي", Building2, "بنكك والبنوك السودانية"], ["wallet", "محفظة إلكترونية", Smartphone, "mCash أو Zain Cash"],
        ] as const).map(([value, label, Icon, hint]) => <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${method === value ? "border-ink-900 bg-ink-100/40" : "border-line bg-white hover:border-ink-700"}`}><input type="radio" name="payment" checked={method === value} onChange={() => changeMethod(value)} className="mt-1 accent-ink-900" /><span><Icon size={19} className="mb-2 text-ink-700" /><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{hint}</span></span></label>)}</div>
        {method !== "cod" && <div className="mt-5 rounded-xl bg-paper/70 p-4 sm:p-5"><label className="label" htmlFor="co-provider">{method === "bank" ? "اختر البنك الذي تريد التحويل إليه" : "اختر المحفظة الإلكترونية"}</label><select id="co-provider" className="field" required value={provider} onChange={(e) => setProvider(e.target.value)}><option value="">{method === "bank" ? "اختر البنك" : "اختر المحفظة"}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>{fieldError("paymentProvider")}
          {selected && <div className="mt-4 rounded-xl border border-line bg-white p-4 text-sm"><p className="flex items-center gap-2 font-bold text-ink-900"><CheckCircle2 size={17} /> بيانات حساب المتجر</p><dl className="mt-3 space-y-2"><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">اسم صاحب الحساب</dt><dd className="font-semibold">{selected.accountName}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">{method === "bank" ? "رقم الحساب" : "رقم المحفظة"}</dt><dd className="font-semibold" dir="auto">{selected.accountNumber}</dd></div></dl><p className="mt-3 text-xs leading-relaxed text-muted">{selected.accountNumber.includes("يُعدّل") ? "البيانات المعروضة افتراضية إلى أن يحدّثها صاحب المتجر. لا يتم خصم المبلغ تلقائياً." : "استخدم بيانات المتجر أعلاه للتحويل. لا يتم خصم المبلغ تلقائياً."}</p></div>}
          <div className="mt-4"><label className="label" htmlFor="co-reference">رقم مرجع التحويل (اختياري)</label><input id="co-reference" maxLength={120} className="field" dir="auto" value={values.paymentReference} onChange={(e) => set("paymentReference", e.target.value)} /><p className="mt-1.5 text-xs text-muted">سيتم التحقق من التحويل يدوياً بعد تأكيد الطلب.</p></div>
        </div>}
      </fieldset>
    </div>
    <aside className="lg:sticky lg:top-5 lg:self-start"><div className="card p-5 sm:p-6">{summary}<button type="submit" disabled={busy} className="btn btn-dark mt-6 w-full py-3.5 text-base">{busy && <LoaderCircle size={18} className="animate-spin" />}تأكيد الطلب</button><p className="mt-3 text-center text-xs leading-relaxed text-muted">بتأكيد الطلب، سيتم التواصل معك لمتابعة التوصيل والدفع.</p></div></aside>
  </form>;
}
