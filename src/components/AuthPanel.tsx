"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { ShieldIcon } from "@/components/icons";

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
}

export default function AuthPanel({
  user,
  initialMode = "login",
}: {
  user: ProfileUser | null;
  initialMode?: "login" | "register";
}) {
  const router = useRouter();
  const { refresh, notify } = useCart();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    address: "",
  });
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    address: user?.address ?? "",
  });
  const [savedProfile, setSavedProfile] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? login : register),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
        return;
      }
      await refresh();
      notify(mode === "login" ? `أهلًا بعودتك، ${data.user.name}` : "تم إنشاء حسابك بنجاح 🎉");
      router.push(mode === "login" ? "/" : "/products");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setBusy(false);
    if (res.ok) {
      setSavedProfile(true);
      notify("تم حفظ بياناتك");
      router.refresh();
      window.setTimeout(() => setSavedProfile(false), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "تعذّر الحفظ", "error");
    }
  }

  if (user) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card p-5">
          <h2 className="text-xl font-black text-ink-900">بياناتي الشخصية</h2>
          <p className="mt-1 text-sm text-slate-500">
            حدّث معلوماتك ليصلك طلبك بشكل أسرع وأدق.
          </p>
          <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="الاسم الكامل">
              <input
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="البريد الإلكتروني">
              <input value={user.email} disabled className={`${inputClass} bg-slate-100 text-slate-500`} dir="ltr" />
            </Field>
            <Field label="رقم الجوال">
              <input
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                className={inputClass}
                dir="ltr"
                placeholder="05XXXXXXXX"
              />
            </Field>
            <Field label="المدينة">
              <input
                value={profile.city}
                onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))}
                className={inputClass}
                placeholder="الرياض"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="العنوان التفصيلي">
                <textarea
                  value={profile.address}
                  onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
                  rows={3}
                  className={inputClass}
                  placeholder="الحي، الشارع، رقم المبنى"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="btn-gold rounded-full px-6 py-2.5 text-sm font-extrabold disabled:opacity-60"
              >
                {savedProfile ? "✓ تم الحفظ" : busy ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>
        </div>

        <aside className="card h-fit space-y-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-lg font-black text-gold-300">
              {user.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-extrabold text-ink-900">{user.name}</span>
              <span className="block truncate text-xs text-slate-500" dir="ltr">
                {user.email}
              </span>
            </span>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
              user.role === "admin" ? "bg-gold-200 text-ink-900" : "bg-slate-100 text-slate-600"
            }`}
          >
            {user.role === "admin" ? "حساب مسؤول" : "عميل"}
          </span>
          <div className="border-t border-slate-100 pt-3">
            <QuickLink href="/orders" label="طلباتي" hint="متابعة الشحنات والفواتير" />
            <QuickLink href="/wishlist" label="قائمتي المفضلة" hint="المنتجات المحفوظة" />
            {user.role === "admin" && (
              <QuickLink href="/admin" label="لوحة التحكم" hint="المنتجات والطلبات والإحصائيات" />
            )}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="card p-5">
        <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-extrabold transition ${
                mode === value ? "bg-white text-ink-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {value === "login" ? "تسجيل الدخول" : "حساب جديد"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <Field label="الاسم الكامل *">
                <input
                  value={register.name}
                  onChange={(event) => setRegister((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClass}
                  placeholder="أحمد محمد"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="رقم الجوال">
                  <input
                    value={register.phone}
                    onChange={(event) => setRegister((prev) => ({ ...prev, phone: event.target.value }))}
                    className={inputClass}
                    dir="ltr"
                    placeholder="05XXXXXXXX"
                  />
                </Field>
                <Field label="المدينة">
                  <input
                    value={register.city}
                    onChange={(event) => setRegister((prev) => ({ ...prev, city: event.target.value }))}
                    className={inputClass}
                    placeholder="الرياض"
                  />
                </Field>
              </div>
            </>
          )}

          <Field label="البريد الإلكتروني *">
            <input
              type="email"
              value={mode === "login" ? login.email : register.email}
              onChange={(event) =>
                mode === "login"
                  ? setLogin((prev) => ({ ...prev, email: event.target.value }))
                  : setRegister((prev) => ({ ...prev, email: event.target.value }))
              }
              className={inputClass}
              dir="ltr"
              placeholder="name@email.com"
              autoComplete="email"
            />
          </Field>

          <Field label="كلمة المرور *">
            <input
              type="password"
              value={mode === "login" ? login.password : register.password}
              onChange={(event) =>
                mode === "login"
                  ? setLogin((prev) => ({ ...prev, password: event.target.value }))
                  : setRegister((prev) => ({ ...prev, password: event.target.value }))
              }
              className={inputClass}
              dir="ltr"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>

          {mode === "register" && (
            <Field label="العنوان">
              <input
                value={register.address}
                onChange={(event) => setRegister((prev) => ({ ...prev, address: event.target.value }))}
                className={inputClass}
                placeholder="الحي، الشارع، رقم المبنى"
              />
            </Field>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-gold w-full rounded-full py-2.5 text-sm font-extrabold disabled:opacity-60"
          >
            {busy ? "جارٍ المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>

          {mode === "login" && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-extrabold text-ink-900">حساب تجريبي للمسؤول:</p>
              <p dir="ltr" className="mt-1 font-mono">
                admin@souq.sa / admin1234
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="card flex flex-col justify-center gap-4 bg-gradient-to-l from-ink-950 to-ink-700 p-6 text-white">
        <h2 className="text-2xl font-black">لماذا تنشئ حسابًا في سوق؟</h2>
        <ul className="space-y-3 text-sm">
          {[
            "متابعة طلباتك وشحناتك لحظة بلحظة",
            "حفظ منتجاتك المفضلة والرجوع إليها بسرعة",
            "دفع أسرع بعنوان محفوظ مسبقًا",
            "الوصول المبكر للعروض والخصومات الحصرية",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <ShieldIcon width={17} height={17} className="mt-0.5 shrink-0 text-gold-400" />
              <span className="text-white/85">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-sm transition hover:bg-slate-50"
    >
      <span>
        <span className="block font-extrabold text-ink-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="text-slate-400">←</span>
    </a>
  );
}
