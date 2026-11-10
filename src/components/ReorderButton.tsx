"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export default function ReorderButton({
  items,
  label = "إعادة الطلب",
  variant = "gold",
}: {
  items: Array<{ productId: number | null; quantity: number }>;
  label?: string;
  variant?: "gold" | "outline";
}) {
  const { refresh, notify } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function reorder() {
    setBusy(true);
    let added = 0;
    for (const item of items) {
      if (!item.productId) continue;
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
      });
      if (res.ok) added += 1;
    }
    await refresh();
    setBusy(false);
    if (added > 0) {
      notify(`تمت إضافة ${added} منتج إلى السلة`);
      router.push("/cart");
    } else {
      notify("تعذّرت إضافة المنتجات، قد تكون غير متوفرة", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={reorder}
      disabled={busy}
      className={
        variant === "gold"
          ? "btn-gold rounded-full px-5 py-2 text-sm font-extrabold disabled:opacity-60"
          : "rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-ink-800 transition hover:bg-slate-50 disabled:opacity-60"
      }
    >
      {busy ? "جارٍ الإضافة..." : label}
    </button>
  );
}
