export const STORE_NAME = "قافلة";
export const CURRENCY = "ر.س";

/** All money values are integers in halalas (1 SAR = 100). */
export const FREE_SHIPPING_THRESHOLD = 20000;
export const SHIPPING_FEE = 1900;
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
  pending: "استلمنا طلبك وسنبدأ تجهيزه قريباً.",
  processing: "نجهّز منتجاتك ونغلّفها للشحن.",
  shipped: "طلبك مع مندوب التوصيل وفي الطريق إليك.",
  delivered: "تم تسليم الطلب. نتمنى أن تنال المنتجات إعجابك.",
  cancelled: "أُلغي هذا الطلب وأُعيدت الكميات إلى المخزون.",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export const CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الطائف",
  "أبها",
  "خميس مشيط",
  "تبوك",
  "بريدة",
  "حائل",
  "جازان",
  "نجران",
  "ينبع",
  "الجبيل",
  "الأحساء",
];

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
