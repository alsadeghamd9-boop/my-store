"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Info, LoaderCircle } from "lucide-react";
import { api } from "@/lib/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const errs: Record<string, string> = {};
    if (register && name.trim().length < 2) errs.name = "اكتب اسمك (حرفان على الأقل).";
    if (!EMAIL_RE.test(email.trim()))
      errs.email = "اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com.";
    if (register ? password.length < 8 : password.length === 0)
      errs.password = register ? "كلمة المرور يجب ألا تقل عن 8 أحرف." : "اكتب كلمة المرور.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const res = await api(
      `/api/auth/${mode}`,
      "POST",
      register ? { name, email, password } : { email, password },
    );
    if (!res.ok) {
      setBusy(false);
      setErrors(res.fields ?? {});
      setFormError(res.error);
      return;
    }
    // Full navigation so the header and cart pick up the new session.
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-deal/40 bg-white px-3.5 py-3 text-sm font-medium text-deal"
        >
          <Info size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
          {formError}
        </p>
      )}

      {register && (
        <div>
          <label htmlFor="auth-name" className="label">
            الاسم
          </label>
          <input
            id="auth-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "auth-name-err" : undefined}
            className="field"
          />
          {errors.name && (
            <p id="auth-name-err" className="field-error">
              {errors.name}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="label">
          البريد الإلكتروني
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "auth-email-err" : undefined}
          className="field text-end"
        />
        {errors.email && (
          <p id="auth-email-err" className="field-error">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="auth-password" className="label">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            type={show ? "text" : "password"}
            dir="ltr"
            autoComplete={register ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "auth-password-err" : register ? "auth-password-hint" : undefined
            }
            className="field pl-12 text-end"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            aria-pressed={show}
            className="absolute inset-y-1 left-1 grid w-10 place-items-center rounded-lg text-muted hover:bg-paper hover:text-body"
          >
            {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        {errors.password ? (
          <p id="auth-password-err" className="field-error">
            {errors.password}
          </p>
        ) : register ? (
          <p id="auth-password-hint" className="mt-1.5 text-xs text-muted">
            8 أحرف على الأقل.
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-base">
        {busy && <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />}
        {register ? "إنشاء الحساب" : "تسجيل الدخول"}
      </button>

    </form>
  );
}
