import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { categories, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { listCategories, searchProducts } from "@/db/queries";
import { fail, ok, readJson, slugify, toNumber, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/17726845/pexels-photo-17726845.jpeg?auto=compress&cs=tinysrgb&w=900";

function toArrayValue(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    const items = value.map((entry) => toStringValue(entry)).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }
  if (typeof value === "string" && value.trim()) {
    const items = value
      .split(/[\n,؛]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    return items.length > 0 ? items : fallback;
  }
  return fallback;
}

export async function GET(req: Request) {
  await ensureBootstrap();
  const params = new URL(req.url).searchParams;
  const page = Math.max(1, toNumber(params.get("page")) ?? 1);
  const perPage = Math.min(48, Math.max(4, toNumber(params.get("perPage")) ?? 12));

  const result = await searchProducts({
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    brand: params.get("brand") ?? undefined,
    minPrice: toNumber(params.get("minPrice")),
    maxPrice: toNumber(params.get("maxPrice")),
    minRating: toNumber(params.get("minRating")),
    featured: params.get("featured") === "1",
    inStock: params.get("inStock") === "1",
    sort: params.get("sort") ?? undefined,
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  const cats = await listCategories();

  return ok({
    items: result.items,
    total: result.total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(result.total / perPage)),
    categories: cats,
  });
}

export async function POST(req: Request) {
  await ensureBootstrap();
  const admin = await requireAdmin();
  if (!admin) return fail("صلاحية المسؤول مطلوبة", 401);

  const body = await readJson(req);
  const title = toStringValue(body.title);
  if (title.length < 3) return fail("اسم المنتج مطلوب");

  const price = toNumber(body.price);
  if (price === undefined || price <= 0) return fail("السعر غير صحيح");

  const categorySlug = toStringValue(body.categorySlug);
  let categoryId: number | null = null;
  if (categorySlug) {
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    categoryId = row?.id ?? null;
  }

  const base = toStringValue(body.slug) ? slugify(toStringValue(body.slug)) : slugify(title);
  const clash = await db.select({ id: products.id }).from(products).where(eq(products.slug, base)).limit(1);
  const slug = clash.length > 0 ? `${base}-${Date.now().toString(36)}` : base;

  const image = toStringValue(body.image) || FALLBACK_IMAGE;
  const oldPrice = toNumber(body.oldPrice);
  const stock = Math.max(0, Math.round(toNumber(body.stock) ?? 0));

  const [created] = await db
    .insert(products)
    .values({
      title,
      slug,
      brand: toStringValue(body.brand) || null,
      description: toStringValue(body.description) || title,
      bullets: toArrayValue(body.bullets),
      price,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
      stock,
      rating: 0,
      reviewCount: 0,
      image,
      gallery: toArrayValue(body.gallery, [image]),
      categoryId,
      featured: Boolean(body.featured),
      fastShipping: Boolean(body.fastShipping),
    })
    .returning();

  return ok({ product: created }, { status: 201 });
}
