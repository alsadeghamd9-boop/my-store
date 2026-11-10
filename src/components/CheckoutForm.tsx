"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ShieldIcon, TruckIcon, ReturnIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";

const CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الطائف",
  "تبوك",
  "أبها",
  "بريدة",
  "حائل",
  "نجران",
  "جيزان",
];

interface Profile {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  role: string;
}

export default function CheckoutForm() {
  const router = useRouter();
  const { items, totals, promo, refresh, ready } = useCart();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: CITIES[0],
    address: "",
    notes: "",
  });
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.user) return;
        const user = data.user as Profile;
        setProfile(user);
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name,
          email: prev.email || user.email,
          phone: prev.phone || user.phone || "",
          city: prev.city || user.city || CITIES[0],
          address: prev.address || user.address || "",
        }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function validate(): string | null {
    if (form.fullName.trim().length < 3) return "الرجاء إدخال الاسم الكامل";
    if (!/^[0-9+\s-]{7,15}$/.test(form.phone.trim())) return "رقم الجوال غير صحيح (مثال: 0551234567)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "البريد الإلكتروني غير صحيح";
    if (form.address.trim().length < 5) return "الرجاء إدخال عنوان تفصيلي";
    if (payment === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12) return "رقم البطاقة غير صحيح";
      if (card.name.trim().length < 3) return "اسم صاحب البطاقة مطلوب";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return "تاريخ الانتهاء بصيغة MM/YY";
      if (!/^\d{3,4}$/.test(card.cvv)) return "رمز الأمان غير صحيح";
    }
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paymentMethod: payment, promoCode: promo || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "تعذّر إتمام الطلب");
        return;
      }
      await refresh();
      router.push(`/orders/${data.id}?placed=1`);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="card skeleton h-64 w-full" />;
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="text-4xl">🧺</span>
        <h2 className="text-lg font-extrabold">لا توجد منتجات لإتمام شرائها</h2>
        <p className="max-w-sm text-sm text-slate-500">أضف منتجات إلى السلة أولًا ثم عد لإتمام الطلب.</p>
        <Link href="/products" className="btn-gold rounded-full px-6 py-2.5 text-sm font-extrabold">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3">
            <h2 className="font-extrabold text-ink-900">
              <span className="ml-2 inline-grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white">
                1
              </span>
              عنوان التوصيل
            </h2>
            {profile && (
              <span className="text-xs font-bold text-emerald-700">✓ مسجّل الدخول كـ {profile.name}</span>
            )}
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label="الاسم الكامل *">
              <input value={form.fullName} onChange={set("fullName")} className={inputClass} placeholder="مثال: أحمد محمد" />
            </Field>
            <Field label="رقم الجوال *">
              <input
                value={form.phone}
                onChange={set("phone")}
                className={inputClass}
                placeholder="05XXXXXXXX"
                inputMode="tel"
                dir="ltr"
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <input
                value={form.email}
                onChange={set("email")}
                className={inputClass}
                placeholder="name@email.com"
                dir="ltr"
              />
            </Field>
            <Field label="المدينة *">
              <select value={form.city} onChange={set("city")} className={inputClass}>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="العنوان التفصيلي *">
                <textarea
                  value={form.address}
                  onChange={set("address")}
                  rows={2}
                  className={inputClass}
                  placeholder="الحي، الشارع، رقم المبنى، الرمز البريدي"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="ملاحظات للمندوب (اختياري)">
                <input value={form.notes} onChange={set("notes")} className={inputClass} placeholder="مثال: الاتصال قبل الوصول" />
              </Field>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
            <h2 className="font-extrabold text-ink-900">
              <span className="ml-2 inline-grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white">
                2
              </span>
              طريقة الدفع
            </h2>
          </div>
          <div className="space-y-2 p-4">
            <PaymentOption
              active={payment === "cod"}
              onSelect={() => setPayment("cod")}
              title="الدفع عند الاستلام"
              description="ادفع نقدًا أو بالشبكة عند استلام طلبك"
              badge="الأكثر استخدامًا"
              icon="💵"
            />
            <PaymentOption
              active={payment === "card"}
              onSelect={() => setPayment("card")}
              title="بطاقة ائتمانية / مدى"
              description="Visa، Mastercard، مدى، Apple Pay"
              badge="آمن ومشفر"
              icon="💳"
            />

            {payment === "card" && (
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="رقم البطاقة">
                    <input
                      value={card.number}
                      onChange={(event) =>
                        setCard((prev) => ({
                          ...prev,
                          number: event.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, 16)
                            .replace(/(.{4})/g, "$1 ")
                            .trim(),
                        }))
                      }
                      className={inputClass}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      dir="ltr"
                    />
                  </Field>
                </div>
                <Field label="اسم صاحب البطاقة">
                  <input
                    value={card.name}
                    onChange={(event) => setCard((prev) => ({ ...prev, name: event.target.value }))}
                    className={inputClass}
                    placeholder="AHMED MOHAMMED"
                    dir="ltr"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الانتهاء">
                    <input
                      value={card.expiry}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 4);
                        setCard((prev) => ({
                          ...prev,
                          expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                        }));
                      }}
                      className={inputClass}
                      placeholder="MM/YY"
                      dir="ltr"
                    />
                  </Field>
                  <Field label="CVV">
                    <input
                      value={card.cvv}
                      onChange={(event) =>
                        setCard((prev) => ({ ...prev, cvv: event.target.value.replace(/[^\d]/g, "").slice(0, 4) }))
                      }
                      className={inputClass}
                      placeholder="123"
                      dir="ltr"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-slate-500 sm:col-span-2">
                  بيئة تجريبية: لن يتم خصم أي مبلغ حقيقي.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
            <h2 className="font-extrabold text-ink-900">
              <span className="ml-2 inline-grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white">
                3
              </span>
              مراجعة المنتجات ({items.length})
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-14 w-14 rounded-lg bg-slate-50 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    الكمية: {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <span className="text-sm font-black">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 p-3 text-right">
            <Link href="/cart" className="text-sm font-bold text-sky-700 hover:underline">
              ← تعديل السلة
            </Link>
          </div>
        </div>
      </div>

      <aside className="card h-fit p-4 lg:sticky lg:top-32">
        <h2 className="text-lg font-extrabold text-ink-900">إجمالي الطلب</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">المجموع الفرعي</dt>
            <dd className="font-bold">{formatPrice(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>الخصم {promo ? `(${promo})` : ""}</dt>
              <dd className="font-bold">− {formatPrice(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-600">الشحن</dt>
            <dd className={`font-bold ${totals.shipping === 0 ? "text-emerald-700" : ""}`}>
              {totals.shipping === 0 ? "مجاني" : formatPrice(totals.shipping)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-200 pt-2">
            <dt className="text-base font-extrabold">الإجمالي المستحق</dt>
            <dd className="text-xl font-black text-rose-600">{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-orange mt-4 w-full rounded-full py-3 text-sm font-extrabold disabled:opacity-60"
        >
          {busy ? "جارٍ تأكيد الطلب..." : `تأكيد الطلب • ${formatPrice(totals.total)}`}
        </button>

        <p className="mt-2 text-center text-[11px] text-slate-500">
          بالضغط على تأكيد الطلب فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>

        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <li className="flex items-center gap-1.5">
            <TruckIcon width={14} height={14} className="text-emerald-600" /> توصيل خلال 1-4 أيام عمل
          </li>
          <li className="flex items-center gap-1.5">
            <ReturnIcon width={14} height={14} className="text-emerald-600" /> إرجاع مجاني خلال 15 يومًا
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldIcon width={14} height={14} className="text-emerald-600" /> حماية المشتري كاملة
          </li>
        </ul>
      </aside>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PaymentOption({
  active,
  onSelect,
  title,
  description,
  badge,
  icon,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  badge: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-right transition ${
        active ? "border-gold-500 bg-gold-200/20 ring-2 ring-gold-400/40" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-ink-900">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
        {badge}
      </span>
    </button>
  );
}
