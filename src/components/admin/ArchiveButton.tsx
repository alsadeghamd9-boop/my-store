"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

/** Archive (hide from the shop) or restore a product, with an inline confirm. */
export default function ArchiveButton({ productId, active }: { productId: number; active: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await api(`/api/admin/products/${productId}`, "PATCH", { active: !active });
    setBusy(false);
    setConfirming(false);
    if (!res.ok) {
      toast({ tone: "error", message: res.error });
      return;
    }
    toast({ message: active ? "أُرشف المنتج وأُخفي من المتجر." : "أُعيد عرض المنتج في المتجر." });
    router.refresh();
  }

  const link = "rounded-md px-1 text-sm font-semibold hover:underline disabled:opacity-60";

  if (!active) {
    return (
      <button type="button" onClick={toggle} disabled={busy} className={`${link} text-express`}>
        {busy ? "جارٍ…" : "استعادة"}
      </button>
    );
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${link} text-deal`}>
        أرشفة
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={toggle} disabled={busy} className={`${link} text-deal`}>
        {busy ? "جارٍ…" : "تأكيد الأرشفة"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className={`${link} text-muted`}
      >
        تراجع
      </button>
    </span>
  );
}
