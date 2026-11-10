"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

export default function PasswordForm() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!current) errs.current = "اكتب كلمة المرور الحالية.";
    if (next.length < 8) errs.next = "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.";
    else if (next === current) errs.next = "اختر كلمة مرور مختلفة عن الحالية.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const res = await api("/api/auth/password", "POST", { current, next });
    setBusy(false);
    if (!res.ok) {
      setErrors(res.fields ?? {});
      if (!res.fields) toast({ tone: "error", message: res.error });
      return;
    }
    setCurrent("");
    setNext("");
    setErrors({});
    toast({ message: "تغيّرت كلمة المرور، وسُجّل خروجك من الأجهزة الأخرى." });
  }

  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="pw-current" className="label">
          كلمة المرور الحالية
        </label>
        <input
          id="pw-current"
          type={type}
          dir="ltr"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          aria-invalid={Boolean(errors.current)}
          aria-describedby={errors.current ? "pw-current-err" : undefined}
          className="field text-end"
        />
        {errors.current && (
          <p id="pw-current-err" className="field-error">
            {errors.current}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="pw-next" className="label">
          كلمة المرور الجديدة
        </label>
        <input
          id="pw-next"
          type={type}
          dir="ltr"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          aria-invalid={Boolean(errors.next)}
          aria-describedby={errors.next ? "pw-next-err" : "pw-next-hint"}
          className="field text-end"
        />
        {errors.next ? (
          <p id="pw-next-err" className="field-error">
            {errors.next}
          </p>
        ) : (
          <p id="pw-next-hint" className="mt-1.5 text-xs text-muted">
            8 أحرف على الأقل.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-2">
        <button type="submit" disabled={busy} className="btn btn-dark">
          {busy && <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />}
          تغيير كلمة المرور
        </button>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="size-4 accent-ink-900"
          />
          إظهار كلمتي المرور
        </label>
      </div>
    </form>
  );
}
