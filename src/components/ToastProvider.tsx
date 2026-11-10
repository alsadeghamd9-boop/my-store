"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, CircleX, X } from "lucide-react";

type ToastInput = {
  message: string;
  tone?: "success" | "error";
  href?: string;
  hrefLabel?: string;
};
type Toast = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.tone === "error" ? 6500 : 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="on-dark pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-3"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink-950 py-3 ps-4 pe-2 text-sm text-white shadow-[0_16px_40px_-8px_rgba(6,25,28,0.6)]"
            style={{ animation: "toast-in 180ms ease-out" }}
          >
            {t.tone === "error" ? (
              <CircleX size={20} aria-hidden="true" className="shrink-0 text-[#ff9d8f]" />
            ) : (
              <CircleCheck size={20} aria-hidden="true" className="shrink-0 text-saffron-400" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
            {t.href && (
              <Link
                href={t.href}
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-full px-2 py-1 font-semibold text-saffron-300 hover:underline"
              >
                {t.hrefLabel ?? "عرض"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="إغلاق التنبيه"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-100 hover:bg-white/10 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
