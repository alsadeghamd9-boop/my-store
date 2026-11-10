"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

/** Two-step cancel so a stray tap can't cancel an order. */
export default function CancelOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    const res = await api(`/api/orders/${orderId}/cancel`, "POST");
    setBusy(false);
    setConfirming(false);
    if (!res.ok) {
      toast({ tone: "error", message: res.error });
      router.refresh();
      return;
    }
    toast({ message: "أُلغي الطلب." });
    router.refresh();
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-danger">
        إلغاء الطلب
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تأكيد إلغاء الطلب">
      <span className="text-sm font-medium text-body">هل تريد إلغاء هذا الطلب؟</span>
      <button type="button" onClick={cancel} disabled={busy} className="btn btn-danger">
        {busy ? "جارٍ الإلغاء…" : "نعم، ألغِ الطلب"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="btn btn-outline"
      >
        تراجع
      </button>
    </div>
  );
}
