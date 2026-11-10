"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, LoaderCircle, ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

type Props = {
  productId: number;
  outOfStock?: boolean;
  quantity?: number;
  className?: string;
};

export default function AddToCartButton({
  productId,
  outOfStock = false,
  quantity = 1,
  className = "",
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function add() {
    if (state === "loading") return;
    setState("loading");
    const res = await api<{ count: number; capped?: boolean }>("/api/cart", "POST", {
      productId,
      quantity,
    });
    if (!res.ok) {
      setState("idle");
      toast({ tone: "error", message: res.error });
      return;
    }
    setState("done");
    toast({
      message: res.data.capped
        ? "أُضيفت الكمية المتاحة فقط إلى السلة."
        : "أُضيف المنتج إلى السلة.",
      href: "/cart",
      hrefLabel: "عرض السلة",
    });
    router.refresh();
    setTimeout(() => setState("idle"), 1600);
  }

  if (outOfStock) {
    return (
      <button type="button" disabled className={`btn btn-outline w-full px-3 ${className}`}>
        غير متوفر حالياً
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      aria-busy={state === "loading"}
      className={`btn btn-primary w-full px-3 ${className}`}
    >
      {state === "loading" ? (
        <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />
      ) : state === "done" ? (
        <Check size={17} aria-hidden="true" />
      ) : (
        <ShoppingCart size={17} aria-hidden="true" />
      )}
      {state === "done" ? "أُضيف" : "أضف إلى السلة"}
    </button>
  );
}
