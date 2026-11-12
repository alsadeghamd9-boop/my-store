import { cache } from "react";
import { and, asc, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products, reviews, users, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { SortKey } from "@/lib/constants";
import { ensureSeeded } from "@/lib/seed";

export const cardFields = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  price: products.price,
  listPrice: products.listPrice,
  images: products.images,
  ratingAvg: products.ratingAvg,
  ratingCount: products.ratingCount,
  stock: products.stock,
  express: products.express,
  isDeal: products.isDeal,
};

export type ProductCardData = {
  id: number;
  slug: string;
  title: string;
  brand: string;
  price: number;
  listPrice: number | null;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  stock: number;
  express: boolean;
  isDeal: boolean;
};

export const getCategories = cache(async () => {
  await ensureSeeded();
  return getDb().select().from(categories).orderBy(asc(categories.sort), asc(categories.id));
});

/** Fold common Arabic spelling variants so "ساعه" finds "ساعة". */
export function normalizeArabic(input: string) {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

const FOLD_FROM = "أإآةى";
const FOLD_TO = "اااهي";

export type ProductFilters = {
  q?: string;
  categoryId?: number;
  min?: number;
  max?: number;
  rating?: number;
  express?: boolean;
  deal?: boolean;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
};

export async function listProducts(f: ProductFilters = {}) {
  await ensureSeeded();
  const conds: SQL[] = [eq(products.active, true)];
  if (f.categoryId) conds.push(eq(products.categoryId, f.categoryId));
  if (f.min != null) conds.push(gte(products.price, f.min));
  if (f.max != null) conds.push(lte(products.price, f.max));
  if (f.rating) conds.push(gte(products.ratingAvg, f.rating));
  if (f.express) conds.push(eq(products.express, true));
  if (f.deal) conds.push(eq(products.isDeal, true));
  // Products whose title contains every search term rank above description-only hits.
  let relevance: SQL | undefined;
  if (f.q) {
    const terms = normalizeArabic(f.q).split(/\s+/).filter(Boolean).slice(0, 6);
    const titleHits: SQL[] = [];
    for (const term of terms) {
      const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
      titleHits.push(
        sql`translate(lower(products.title), ${FOLD_FROM}, ${FOLD_TO}) like ${pattern}`,
      );
      conds.push(sql`(
        translate(lower(products.title), ${FOLD_FROM}, ${FOLD_TO}) like ${pattern}
        or translate(lower(products.brand), ${FOLD_FROM}, ${FOLD_TO}) like ${pattern}
        or translate(lower(products.description), ${FOLD_FROM}, ${FOLD_TO}) like ${pattern}
        or exists (
          select 1 from categories c
          where c.id = products.category_id
            and translate(lower(c.name), ${FOLD_FROM}, ${FOLD_TO}) like ${pattern}
        )
      )`);
    }
    if (titleHits.length) {
      relevance = sql`case when ${sql.join(titleHits, sql` and `)} then 0 else 1 end`;
    }
  }
  const where = and(...conds);

  const sortOrder: SQL[] =
    f.sort === "price-asc"
      ? [asc(products.price)]
      : f.sort === "price-desc"
        ? [desc(products.price)]
        : f.sort === "rating"
          ? [desc(products.ratingAvg), desc(products.ratingCount)]
          : f.sort === "newest"
            ? [desc(products.createdAt)]
            : [desc(products.soldCount)];
  const byRelevance = relevance && (!f.sort || f.sort === "featured") ? [relevance] : [];
  const order: SQL[] = [...byRelevance, ...sortOrder, asc(products.id)];

  const pageSize = f.pageSize ?? 12;
  const page = Math.max(1, f.page ?? 1);
  const [items, [{ n }]] = await Promise.all([
    getDb().select(cardFields)
      .from(products)
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    getDb().select({ n: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  return { items, total: n, page, pageSize, pages: Math.max(1, Math.ceil(n / pageSize)) };
}

export const getProductBySlug = cache(async (slug: string) => {
  await ensureSeeded();
  const rows = await getDb().select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);
  return rows[0] ?? null;
});

export async function getRelatedProducts(categoryId: number, excludeId: number, limit = 6) {
  return getDb().select(cardFields)
    .from(products)
    .where(
      and(eq(products.active, true), eq(products.categoryId, categoryId), ne(products.id, excludeId)),
    )
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export const getWishlistIds = cache(async (): Promise<Set<number>> => {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const rows = await getDb().select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, user.id));
  return new Set(rows.map((r) => r.productId));
});

export async function getProductReviews(productId: number) {
  return getDb().select({
      id: reviews.id,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      createdAt: reviews.createdAt,
      userName: users.name,
      // "Verified buyer" = the reviewer has a non-cancelled order with this product.
      verified: sql<boolean>`exists (
        select 1 from order_items oi
        inner join orders o on o.id = oi.order_id
        where oi.product_id = reviews.product_id
          and o.user_id = reviews.user_id
          and o.status <> 'cancelled'
      )`,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(60);
}

export async function getRatingHistogram(productId: number) {
  const rows = await getDb().select({ rating: reviews.rating, n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .groupBy(reviews.rating);
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) counts[r.rating] = r.n;
  return counts;
}

export async function recomputeRating(productId: number) {
  await getDb().execute(sql`
    update products set
      rating_avg = coalesce((select avg(rating)::real from reviews where product_id = ${productId}), 0),
      rating_count = (select count(*)::int from reviews where product_id = ${productId})
    where id = ${productId}
  `);
}
