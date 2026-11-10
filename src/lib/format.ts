const numberFormat = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormat = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPrice(value: number | string | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return `${numberFormat.format(num)} ر.س`;
}

export function formatNumber(value: number): string {
  return compactFormat.format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormat.format(new Date(value));
}

export function discountPercent(price: number, oldPrice?: number | null): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function timeAgo(value: Date | string): string {
  const then = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - then);
  const day = 86400000;
  if (diff < 60000) return "الآن";
  if (diff < 3600000) return `قبل ${Math.floor(diff / 60000)} دقيقة`;
  if (diff < day) return `قبل ${Math.floor(diff / 3600000)} ساعة`;
  if (diff < day * 30) return `قبل ${Math.floor(diff / day)} يوم`;
  return formatDate(value);
}

export const FREE_SHIPPING_THRESHOLD = 300;
export const SHIPPING_FEE = 25;

export const PROMOS: Record<string, { type: "percent" | "shipping"; value: number; label: string }> = {
  WELCOME10: { type: "percent", value: 10, label: "خصم 10% على الطلب" },
  SOUQ25: { type: "percent", value: 25, label: "خصم 25% على الطلب" },
  FREESHIP: { type: "shipping", value: 100, label: "شحن مجاني" },
};

export const ORDER_STATUSES: Record<string, { label: string; tone: string; step: number }> = {
  pending: { label: "قيد المعالجة", tone: "bg-amber-100 text-amber-800", step: 1 },
  confirmed: { label: "تم التأكيد", tone: "bg-sky-100 text-sky-800", step: 2 },
  shipped: { label: "تم الشحن", tone: "bg-indigo-100 text-indigo-800", step: 3 },
  delivered: { label: "تم التوصيل", tone: "bg-emerald-100 text-emerald-800", step: 4 },
  cancelled: { label: "ملغي", tone: "bg-rose-100 text-rose-800", step: 0 },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUSES[status]?.label ?? status;
}

export function orderStatusTone(status: string): string {
  return ORDER_STATUSES[status]?.tone ?? "bg-slate-100 text-slate-700";
}
