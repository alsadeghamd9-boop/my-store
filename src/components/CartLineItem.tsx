"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash } from "lucide-react";
import { ExpressBadge } from "@/components/Badges";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";
import { MAX_QTY } from "@/lib/constants";
import type { CartLine } from "@/lib/cart";

export default function CartLineItem({ line }: { line: CartLine }) {
  const router = useRouter();
  const toast = useToast();
  const [qty, setQty] = useState(line.quantity);
  const [busy, setBusy] = useState(false);
  const max = Math.min(line.stock, MAX_QTY);

  async function setQuantity(next: number) {
    if (busy) return;
    const previous = qty;
    setBusy(true);
    setQty(next);
    const res = await api<{ quantity: number; capped?: boolean }>("/api/cart", "PATCH", {
      productId: line.productId,
      quantity: next,
    });
    setBusy(false);
    if (!res.ok) {
      setQty(previous);
      toast({ tone: "error", message: res.error });
      return;
    }
    setQty(res.data.quantity);
    if (res.data.capped) toast({ message: `المتاح من هذا المنتج ${res.data.quantity} فقط.` });
    router.refresh();
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const res = await api("/api/cart", "DELETE", { productId: line.productId });
    if (!res.ok) {
      setBusy(false);
      toast({ tone: "error", message: res.error });
      return;
    }
    toast({ message: "أُزيل المنتج من السلة." });
    router.refresh();
  }

  const href = `/product/${line.slug}`;

  return (
    <li className={`flex gap-3 p-3 sm:gap-4 sm:p-4 ${busy ? "opacity-70" : ""}`}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <SmartImage
          src={line.image}
          alt=""
          className={`h-20 w-20 rounded-xl bg-paper object-cover sm:h-28 sm:w-28 ${
            line.available ? "" : "opacity-60 grayscale"
          }`}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={href}
              className="line-clamp-2 rounded text-sm leading-snug font-medium text-body hover:text-ink-700 hover:underline sm:text-[15px]"
            >
              {line.title}
            </Link>
            {line.brand && <p className="mt-0.5 text-xs text-muted">{line.brand}</p>}
          </div>
          <div className="hidden shrink-0 text-end sm:block">
            <Money value={line.lineTotal} className="font-display font-bold text-ink-950" />
            {line.available && qty > 1 && (
              <p className="mt-0.5 text-xs text-muted">
                <Money value={line.price} /> للقطعة
              </p>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {!line.available ? (
            <span className="font-semibold text-deal">
              غير متوفر حالياً — أزله من السلة لمتابعة الطلب
            </span>
          ) : line.exceeds ? (
            <span className="font-semibold text-deal">
              المتاح {line.stock} فقط — عدّل الكمية لمتابعة الطلب
            </span>
          ) : (
            <>
              {line.express && <ExpressBadge />}
              {line.stock <= 5 && (
                <span className="font-semibold text-deal">بقي {line.stock} فقط</span>
              )}
            </>
          )}
        </div>

        <p className="mt-2 sm:hidden">
          <Money value={line.lineTotal} className="font-display font-bold text-ink-950" />
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          {line.available && (
            <div
              dir="ltr"
              role="group"
              aria-label="الكمية"
              className="inline-flex items-center rounded-full border border-line bg-white"
            >
              <button
                type="button"
                onClick={() => setQuantity(qty - 1)}
                disabled={busy || qty <= 1}
                aria-label="إنقاص الكمية"
                className="grid h-9 w-9 place-items-center rounded-full text-body hover:bg-paper disabled:cursor-not-allowed disabled:text-[#a9b6b3] disabled:hover:bg-transparent"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(qty + 1)}
                disabled={busy || qty >= max}
                aria-label="زيادة الكمية"
                className="grid h-9 w-9 place-items-center rounded-full text-body hover:bg-paper disabled:cursor-not-allowed disabled:text-[#a9b6b3] disabled:hover:bg-transparent"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
          )}
          {line.exceeds && (
            <button
              type="button"
              onClick={() => setQuantity(line.stock)}
              disabled={busy}
              className="rounded-md text-sm font-semibold text-ink-700 hover:underline"
            >
              اجعلها {line.stock}
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md py-1 text-sm text-muted hover:text-deal"
          >
            <Trash size={15} aria-hidden="true" />
            حذف
          </button>
        </div>
      </div>
    </li>
  );
}
