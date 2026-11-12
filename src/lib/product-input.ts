import { int, str } from "@/lib/api";

export type ProductInput = {
  title: string;
  brand: string;
  description: string;
  features: string[];
  images: string[];
  price: number;
  listPrice: number | null;
  categoryId: number;
  stock: number;
  isDeal: boolean;
  express: boolean;
};

function toPiastres(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 0.01 || n > 20_000_000) return null;
  return Math.round(n * 100);
}

function stringList(value: unknown, maxItems: number, maxLen: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => str(v, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

/** Validates the admin product form. Prices arrive in SDG and are stored in piastres. */
export function parseProductInput(
  body: Record<string, unknown>,
): { data: ProductInput; fields?: undefined } | { data?: undefined; fields: Record<string, string> } {
  const fields: Record<string, string> = {};

  const title = str(body.title, 160);
  if (title.length < 3) fields.title = "اكتب اسماً للمنتج (3 أحرف على الأقل).";

  const price = toPiastres(body.price);
  if (price == null) fields.price = "اكتب سعراً صحيحاً أكبر من صفر.";

  let listPrice: number | null = null;
  if (body.listPrice !== "" && body.listPrice != null) {
    listPrice = toPiastres(body.listPrice);
    if (listPrice == null) fields.listPrice = "اكتب رقماً صحيحاً أو اترك الحقل فارغاً.";
    else if (price != null && listPrice <= price)
      fields.listPrice = "السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي.";
  }

  const categoryId = int(body.categoryId);
  if (!categoryId) fields.categoryId = "اختر القسم.";

  const stock = int(body.stock);
  if (stock == null || stock < 0 || stock > 100_000) fields.stock = "اكتب كمية صحيحة (0 أو أكثر).";

  const images = stringList(body.images, 6, 600);
  if (images.length === 0) fields.images = "ارفع صورة واحدة على الأقل.";
  else if (images.some((u) => !/^(https:\/\/|\/(?!\/))\S+$/.test(u)))
    fields.images = "تعذّر التحقق من الصور المرفوعة.";

  if (Object.keys(fields).length) return { fields };

  return {
    data: {
      title,
      brand: str(body.brand, 60),
      description: str(body.description, 4000),
      features: stringList(body.features, 8, 200),
      images,
      price: price!,
      listPrice,
      categoryId: categoryId!,
      stock: stock!,
      isDeal: body.isDeal === true,
      express: body.express === true,
    },
  };
}
