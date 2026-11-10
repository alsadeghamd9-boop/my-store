import { StarIcon } from "@/components/icons";
import { discountPercent, formatPrice } from "@/lib/format";

export function Stars({
  value,
  count,
  size = 14,
  showValue = false,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1" dir="ltr">
      <span className="inline-flex items-center">
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = rounded - index >= 1;
          const half = !filled && rounded - index >= 0.5;
          return (
            <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
              <StarIcon style={{ width: size, height: size }} className="text-slate-300" />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? size : size / 2 }}
                >
                  <StarIcon style={{ width: size, height: size }} className="text-gold-500" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-semibold text-slate-700">{value.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-xs text-slate-500" dir="rtl">
          ({count.toLocaleString("ar-SA-u-nu-latn")})
        </span>
      )}
    </span>
  );
}

export function Price({
  value,
  old,
  size = "md",
}: {
  value: number;
  old?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { main: "text-sm", old: "text-[11px]" },
    md: { main: "text-lg", old: "text-xs" },
    lg: { main: "text-3xl", old: "text-sm" },
  }[size];

  const off = discountPercent(value, old);

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={`font-extrabold text-ink-900 ${sizes.main}`}>{formatPrice(value)}</span>
      {old && old > value ? (
        <>
          <span className={`text-slate-400 line-through ${sizes.old}`}>{formatPrice(old)}</span>
          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600">
            وفّر {off}%
          </span>
        </>
      ) : null}
    </span>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "blue" | "rose";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  href,
  action = "عرض الكل",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <a href={href} className="shrink-0 text-sm font-bold text-gold-600 hover:text-gold-500">
          {action} ←
        </a>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-3xl">🛒</div>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}
