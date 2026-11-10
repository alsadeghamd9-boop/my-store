import { CURRENCY } from "@/lib/constants";
import { formatPrice, splitPrice } from "@/lib/format";

const SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
} as const;

/** Storefront price: large whole part, small fraction and currency. */
export default function Price({
  value,
  size = "md",
  className = "",
}: {
  value: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { whole, frac } = splitPrice(value);
  return (
    <span
      className={`inline-flex items-baseline gap-1 font-display leading-none font-bold text-ink-950 ${SIZES[size]} ${className}`}
    >
      <span dir="ltr" className="inline-flex items-baseline">
        {whole}
        <span className="text-[0.55em] font-semibold">.{frac}</span>
      </span>
      <span className="font-sans text-[0.5em] font-semibold text-muted">{CURRENCY}</span>
    </span>
  );
}

/** Inline amount for tables and summaries, e.g. "1,299.00 ر.س". */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span dir="ltr">{formatPrice(value)}</span> {CURRENCY}
    </span>
  );
}
