"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Banknote, CreditCard, Info, LoaderCircle, Lock } from "lucide-react";
import { api } from "@/lib/client";
import { CITIES } from "@/lib/constants";

type Defaults = { name: string; phone: string; city: string; district: string; street: string };
type Errors = Partial<Record<keyof Defaults, string>>;

const PHONE_RE = /^(?:\+?966|00966|0)?5\d{8}$/;

export default function CheckoutForm({
  defaults,
  summary,
}: {
  defaults: Defaults;
  summary: ReactNode;
}) {
  const [values, setValues] = useState({ ...defaults, notes: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  function validate(): Errors {
    const next: Errors = {};
    if (values.name.trim().length < 3) next.name = "اكتب الاسم الكامل للمستلم.";
    if (!PHONE_RE.test(values.phone.replace(/[\s\-()]/g, "")))
      next.phone = "اكتب رقم جوال سعودي صحيح، مثل 0512345678.";
    if (!values.city) next.city = "اختر المدينة من القائمة.";
    if (values.district.trim().length < 2) next.district = "اكتب اسم الحي.";
    if (values.street.trim().length < 4) next.street = "اكتب اسم الشارع ورقم المبنى.";
    return next;
  }

  function focusFirst(errs: Errors) {
    const firstKey = (["name", "phone", "city", "district", "street"] as const).find((k) => errs[k]);
    if (firstKey) formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst(errs);
      return;
    }
    setBusy(true);
    const res = await api<{ id: number }>("/api/orders", "POST", {
      ...values,
      paymentMethod: "cod",
    });
    if (!res.ok) {
      setBusy(false);
      if (res.status === 401) {
        window.location.assign("/login?next=/checkout");
        return;
      }
      if (res.fields) {
        setErrors(res.fields as Errors);
        focusFirst(res.fields as Errors);
      }
      setFormError(res.error);
      return;
    }
    // Full navigation so the header cart resets with the new order.
    window.location.assign(`/orders/${res.data.id}?placed=1`);
  }

  const text = (
    key: "name" | "district" | "street",
    label: string,
    props: { autoComplete?: string; placeholder?: string } = {},
  ) => (
    <div>
      <label htmlFor={`co-${key}`} className="label">
        {label}
      </label>
      <input
        id={`co-${key}`}
        name={key}
        value={values[key]}
        onChange={(e) => set(key)(e.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `co-${key}-err` : undefined}
        className="field"
        {...props}
      />
      {errors[key] && (
        <p id={`co-${key}-err`} className="field-error">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-deal/40 bg-white p-4 text-sm text-body"
          >
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-deal" />
            <div>
              <p className="font-semibold text-deal">{formError}</p>
              <Link href="/cart" className="mt-1 inline-block font-semibold text-ink-700 underline">
                العودة إلى السلة
              </Link>
            </div>
          </div>
        )}

        <section className="card p-4 sm:p-6" aria-labelledby="co-address">
          <h2 id="co-address" className="text-lg font-bold text-ink-950">
            1. عنوان التوصيل
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {text("name", "الاسم الكامل للمستلم", { autoComplete: "name" })}
            <div>
              <label htmlFor="co-phone" className="label">
                رقم الجوال
              </label>
              <input
                id="co-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="05XXXXXXXX"
                value={values.phone}
                onChange={(e) => set("phone")(e.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "co-phone-err" : "co-phone-hint"}
                className="field text-end"
              />
              {errors.phone ? (
                <p id="co-phone-err" className="field-error">
                  {errors.phone}
                </p>
              ) : (
                <p id="co-phone-hint" className="mt-1.5 text-xs text-muted">
                  سيتصل بك المندوب على هذا الرقم عند التسليم.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="co-city" className="label">
                المدينة
              </label>
              <select
                id="co-city"
                name="city"
                value={values.city}
                onChange={(e) => set("city")(e.target.value)}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "co-city-err" : undefined}
                className="field"
              >
                <option value="">اختر المدينة</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p id="co-city-err" className="field-error">
                  {errors.city}
                </p>
              )}
            </div>
            {text("district", "الحي", { placeholder: "مثال: حي الملقا" })}
            <div className="sm:col-span-2">
              {text("street", "الشارع ورقم المبنى", {
                autoComplete: "street-address",
                placeholder: "مثال: شارع أنس بن مالك، مبنى 12، شقة 4",
              })}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-notes" className="label">
                ملاحظات للمندوب <span className="font-normal text-muted">(اختياري)</span>
              </label>
              <textarea
                id="co-notes"
                name="notes"
                rows={2}
                maxLength={300}
                value={values.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="مثال: الاتصال قبل الوصول بعشر دقائق"
                className="field resize-y"
              />
            </div>
          </div>
        </section>

        <fieldset className="card p-4 sm:p-6">
          <legend className="float-start mb-4 w-full text-lg font-bold text-ink-950 [font-family:var(--font-display)]">
            2. طريقة الدفع
          </legend>
          <div className="clear-both grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border-2 border-ink-900 bg-white p-4">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                defaultChecked
                className="mt-1 size-4 accent-ink-900"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <Banknote size={18} aria-hidden="true" />
                  الدفع عند الاستلام
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  ادفع نقداً للمندوب عند تسليم طلبك. بدون رسوم إضافية.
                </span>
              </span>
            </label>
            <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-line bg-paper/60 p-4">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                disabled
                className="mt-1 size-4"
              />
              <span>
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                  <CreditCard size={18} aria-hidden="true" />
                  بطاقة مدى أو ائتمانية
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-900">
                    قريباً
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  الدفع الإلكتروني غير مفعّل بعد في هذا المتجر.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-4 lg:self-start">
        <div className="card p-5">
          {summary}
          <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full py-3 text-base">
            {busy ? (
              <>
                <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
                جارٍ تأكيد الطلب…
              </>
            ) : (
              "تأكيد الطلب"
            )}
          </button>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <Lock size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            لن يُخصم أي مبلغ الآن. يمكنك إلغاء الطلب مجاناً قبل شحنه.
          </p>
        </div>
      </aside>
    </form>
  );
}
