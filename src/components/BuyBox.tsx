"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { LoaderCircle, ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import WishlistButton from "@/components/WishlistButton";
import { api } from "@/lib/client";
import { MAX_QTY } from "@/lib/constants";

type Props = { productId: number; stock: number; saved: boolean };

/** Quantity + add to cart / buy now on the product page. */
export default function BuyBox({ productId, stock, saved }: Props) {
  const router = useRouter();
  const toast = useToast();
  const qtyId = useId();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<null | "cart" | "buy">(null);
  const max = Math.max(0, Math.min(stock, MAX_QTY));

  async function add(mode: "cart" | "buy") {
    if (busy) return;
    setBusy(mode);
    const res = await api<{ capped?: boolean }>("/api/cart", "POST", { productId, quantity: qty });
    if (!res.ok) {
      // "Buy now" with the item already at its limit in the cart: just continue.
      if (mode === "buy" && res.status === 409) {
        router.push("/checkout");
        return;
      }
      setBusy(null);
      toast({ tone: "error", message: res.error });
      return;
    }
    router.refresh();
    if (mode === "buy") {
      router.push("/checkout");
      return;
    }
    setBusy(null);
    toast({
      message: res.data.capped ? "أُضيفت الكمية المتاحة فقط إلى السلة." : "أُضيف المنتج إلى السلة.",
      href: "/cart",
      hrefLabel: "عرض السلة",
    });
  }

  if (max === 0) {
    return (
      <div className="space-y-2.5">
        <button type="button" disabled className="btn btn-outline w-full py-3">
          غير متوفر حالياً
        </button>
        <WishlistButton productId={productId} initialSaved={saved} variant="full" />
        <p className="text-xs leading-relaxed text-muted">
          احفظه في المفضلة لتجده بسهولة عند عودته إلى المخزون.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <label htmlFor={qtyId} className="text-sm font-medium text-body">
          الكمية
        </label>
        <select
          id={qtyId}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="field w-24 py-2"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => add("cart")}
        disabled={busy !== null}
        className="btn btn-primary w-full py-3 text-base"
      >
        {busy === "cart" ? (
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
        ) : (
          <ShoppingCart size={18} aria-hidden="true" />
        )}
        أضف إلى السلة
      </button>
      <button
        type="button"
        onClick={() => add("buy")}
        disabled={busy !== null}
        className="btn btn-dark w-full py-3 text-base"
      >
        {busy === "buy" && <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />}
        اشترِ الآن
      </button>
      <WishlistButton productId={productId} initialSaved={saved} variant="full" />
    </div>
  );
}
