export const STORE_NAME = "سوق السودان";
export const CURRENCY = "ج.س";

// Monetary amounts are integer piastres. Adjust these store policies before launch.
export const FREE_SHIPPING_THRESHOLD = 50_000 * 100;
export const SHIPPING_FEE = 2_500 * 100;
export const MAX_QTY = 10;

export function shippingFor(subtotal: number) {
  return subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد المراجعة",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};
export const STATUS_HINTS: Record<OrderStatus, string> = {
  pending: "استلمنا طلبك وهو قيد المراجعة.",
  processing: "نجهّز منتجاتك للشحن.",
  shipped: "طلبك في الطريق إليك.",
  delivered: "تم تسليم الطلب. نتمنى أن تنال المنتجات إعجابك.",
  cancelled: "أُلغي هذا الطلب وأُعيدت الكميات إلى المخزون.",
};
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

// The 18 states of Sudan. City/locality is entered separately at checkout.
export const SUDAN_STATES = [
  "الخرطوم", "الجزيرة", "البحر الأحمر", "كسلا", "القضارف", "سنار", "النيل الأزرق",
  "النيل الأبيض", "شمال كردفان", "جنوب كردفان", "غرب كردفان", "شمال دارفور",
  "جنوب دارفور", "شرق دارفور", "غرب دارفور", "وسط دارفور", "الولاية الشمالية", "نهر النيل",
] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "الأكثر مبيعاً" },
  { value: "price-asc", label: "السعر: من الأقل إلى الأعلى" },
  { value: "price-desc", label: "السعر: من الأعلى إلى الأقل" },
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "newest", label: "الأحدث" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((o) => o.value === value);
}
