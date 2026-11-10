const priceFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const countFmt = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Riyadh",
});
const dayFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Riyadh",
});

/** 129900 -> "1,299.00" */
export function formatPrice(halalas: number) {
  return priceFmt.format(halalas / 100);
}

export function splitPrice(halalas: number) {
  const [whole, frac] = formatPrice(halalas).split(".");
  return { whole, frac: frac ?? "00" };
}

export function formatCount(n: number) {
  return countFmt.format(n);
}

export function formatDate(d: Date) {
  return dateFmt.format(d);
}

export function formatDay(d: Date) {
  return dayFmt.format(d);
}

export function discountPercent(price: number, listPrice?: number | null) {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round((1 - price / listPrice) * 100);
}

/** Arabic plural for "منتج" based on count. */
export function itemsLabel(n: number) {
  if (n === 0) return "لا منتجات";
  if (n === 1) return "منتج واحد";
  if (n === 2) return "منتجان";
  if (n >= 3 && n <= 10) return `${n} منتجات`;
  return `${n} منتجاً`;
}
