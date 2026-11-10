"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { CartIcon } from "@/components/icons";

export default function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex shrink-0 items-end gap-1 rounded-md px-2 py-1 transition hover:outline hover:outline-1 hover:outline-white/40"
      aria-label={`سلة التسوق، ${count} منتج`}
    >
      <span className="relative">
        <CartIcon width={26} height={26} className="text-white" />
        <span
          className="absolute -top-1.5 right-1/2 translate-x-1/2 rounded-full bg-gold-400 px-1 text-[11px] font-black leading-4 text-ink-950"
          dir="ltr"
        >
          {count > 99 ? "99+" : count}
        </span>
      </span>
      <span className="hidden text-sm font-bold sm:block">السلة</span>
    </Link>
  );
}
