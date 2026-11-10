"use client";

import { useCart } from "@/components/CartProvider";
import { CheckIcon, CloseIcon, SparkIcon } from "@/components/icons";

export default function Toasts() {
  const { toasts, dismissToast } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const tones = {
          success: "bg-emerald-600 text-white",
          error: "bg-rose-600 text-white",
          info: "bg-ink-800 text-white",
        }[toast.tone];
        return (
          <div
            key={toast.id}
            className={`animate-toast pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-xl ${tones}`}
            role="status"
          >
            {toast.tone === "success" ? (
              <CheckIcon width={18} height={18} />
            ) : (
              <SparkIcon width={18} height={18} />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="opacity-70 transition hover:opacity-100"
              aria-label="إغلاق"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
