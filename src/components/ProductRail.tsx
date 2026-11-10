"use client";

import { useRef } from "react";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function ProductRail({
  products,
  compact,
}: {
  products: CardProduct[];
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.7), behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="w-[190px] shrink-0 snap-start sm:w-[215px] lg:w-[230px]"
          >
            <ProductCard product={product} compact={compact} priority={index < 4} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="التالي"
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-800 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 lg:grid"
      >
        <ChevronLeft width={20} height={20} />
      </button>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="السابق"
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-800 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 lg:grid"
      >
        <ChevronRight width={20} height={20} />
      </button>
    </div>
  );
}
