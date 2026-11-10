import { and, desc, eq, gte, ilike, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import {
  cartItems,
  categories,
  orderItems,
  orders,
  products,
  reviews,
  users,
  wishlistItems,
} from "@/db/schema";
import { FREE_SHIPPING_THRESHOLD, PROMOS, SHIPPING_FEE } from "@/lib/format";

const productColumns = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  price: products.price,
  oldPrice: products.oldPrice,
  rating: products.rating,
  reviewCount: products.reviewCount,
  image: products.image,
  stock: products.stock,
  sold: products.sold,
  featured: products.featured,
  fastShipping: products.fastShipping,
  createdAt: products.createdAt,
};

export interface ProductListItem {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  stock: number;
  sold: number;
  featured: boolean;
  fastShipping: boolean;
  createdAt: Date;
  categorySlug: string | null;
  categoryName: string | null;
}

export interface ProductFilter {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  featured?: boolean;
  inStock?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
  excludeId?: number;
}

function buildConditions(filter: ProductFilter): SQL[] {
  const conditions: SQL[] = [];
  const q = filter.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(products.title, like),
        ilike(products.brand, like),
        ilike(products.description, like),
      )!,
    );
  }
  if (filter.category) conditions.push(eq(categories.slug, filter.category));
  if (filter.brand) conditions.push(eq(products.brand, filter.brand));
  if (typeof filter.minPrice === "number") conditions.push(gte(products.price, filter.minPrice));
  if (typeof filter.maxPrice === "number") conditions.push(lte(products.price, filter.maxPrice));
  if (typeof filter.minRating === "number") conditions.push(gte(products.rating, filter.minRating));
  if (filter.featured) conditions.push(eq(products.featured, true));
  if (filter.inStock) conditions.push(sql`${products.stock} > 0`);
  if (filter.excludeId) conditions.push(sql`${products.id} <> ${filter.excludeId}`);
  return conditions;
}

function buildOrderBy(sort?: string) {
  switch (sort) {
    case "price-asc":
      return [sql`${products.price} asc`];
    case "price-desc":
      return [sql`${products.price} desc`];
    case "rating":
      return [desc(products.rating), desc(products.reviewCount)];
    case "newest":
      return [desc(products.id)];
    case "bestselling":
      return [desc(products.sold)];
    case "discount":
      return [
        sql`case when ${products.oldPrice} is null then 0 else (${products.oldPrice} - ${products.price}) / ${products.oldPrice} end desc`,
      ];
    default:
      return [desc(products.featured), desc(products.sold)];
  }
}

export async function searchProducts(filter: ProductFilter = {}) {
  await ensureBootstrap();
  const conditions = buildConditions(filter);
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filter.limit ?? 12;
  const offset = filter.offset ?? 0;

  const rows = await db
    .select({
      ...productColumns,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(where)
    .orderBy(...buildOrderBy(filter.sort))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(where);

  return { items: rows as ProductListItem[], total: count };
}

export async function listCategories() {
  await ensureBootstrap();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      tagline: categories.tagline,
      image: categories.image,
      count: sql<number>`(select count(*)::int from products where category_id = ${categories.id})`,
    })
    .from(categories)
    .orderBy(categories.sortOrder);
  return rows;
}

export async function listBrands(category?: string) {
  await ensureBootstrap();
  const conditions: SQL[] = [isNotNull(products.brand)];
  if (category) conditions.push(eq(categories.slug, category));
  const rows = await db
    .selectDistinct({ brand: products.brand })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conditions));
  return rows.map((row) => row.brand).filter(Boolean) as string[];
}

export async function getProductBySlug(slug: string) {
  await ensureBootstrap();
  const rows = await db
    .select({
      ...productColumns,
      description: products.description,
      bullets: products.bullets,
      gallery: products.gallery,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProductById(id: number) {
  await ensureBootstrap();
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listReviews(productId: number) {
  await ensureBootstrap();
  return db
    .select({
      id: reviews.id,
      author: reviews.author,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      verified: reviews.verified,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
}

export interface CartLine {
  id: number;
  productId: number;
  slug: string;
  title: string;
  brand: string | null;
  image: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  quantity: number;
}

export async function getCart(sessionId: string | null): Promise<{ items: CartLine[]; count: number; subtotal: number }> {
  await ensureBootstrap();
  if (!sessionId) return { items: [], count: 0, subtotal: 0 };
  const rows = await db
    .select({
      id: cartItems.id,
      productId: products.id,
      slug: products.slug,
      title: products.title,
      brand: products.brand,
      image: products.image,
      price: products.price,
      oldPrice: products.oldPrice,
      stock: products.stock,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.sessionId, sessionId))
    .orderBy(desc(cartItems.id));

  const items = rows as CartLine[];
  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

export async function getWishlist(sessionId: string | null) {
  await ensureBootstrap();
  if (!sessionId) return [];
  const rows = await db
    .select({
      ...productColumns,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(wishlistItems.sessionId, sessionId))
    .orderBy(desc(wishlistItems.id));
  return rows as ProductListItem[];
}

export function computeTotals(subtotal: number, promoCode?: string | null) {
  const baseShipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const promo = promoCode ? PROMOS[promoCode.trim().toUpperCase()] : undefined;
  const discount = promo?.type === "percent" ? Math.round(subtotal * promo.value) / 100 : 0;
  const shipping = promo?.type === "shipping" ? 0 : baseShipping;
  const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total,
    promoValid: Boolean(promo),
    promoLabel: promo?.label ?? null,
  };
}

export interface CheckoutInput {
  sessionId: string;
  userId: number | null;
  customer: {
    fullName: string;
    email?: string | null;
    phone: string;
    city: string;
    address: string;
    notes?: string | null;
  };
  paymentMethod: "cod" | "card";
  promoCode?: string | null;
}

export async function createOrder(input: CheckoutInput) {
  await ensureBootstrap();
  const cart = await getCart(input.sessionId);
  if (cart.items.length === 0) throw new Error("EMPTY_CART");

  for (const line of cart.items) {
    if (line.stock < line.quantity) throw new Error(`OUT_OF_STOCK:${line.title}`);
  }

  const totals = computeTotals(cart.subtotal, input.promoCode);
  const reference = `SQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        reference,
        userId: input.userId,
        fullName: input.customer.fullName,
        email: input.customer.email ?? null,
        phone: input.customer.phone,
        city: input.customer.city,
        address: input.customer.address,
        notes: input.customer.notes ?? null,
        paymentMethod: input.paymentMethod,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        status: "pending",
      })
      .returning();

    await tx.insert(orderItems).values(
      cart.items.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        title: line.title,
        image: line.image,
        price: line.price,
        quantity: line.quantity,
      })),
    );

    for (const line of cart.items) {
      await tx
        .update(products)
        .set({
          stock: sql`greatest(0, ${products.stock} - ${line.quantity})`,
          sold: sql`${products.sold} + ${line.quantity}`,
        })
        .where(eq(products.id, line.productId));
    }

    await tx.delete(cartItems).where(eq(cartItems.sessionId, input.sessionId));

    return order;
  });
}

export async function listOrdersForUser(userId: number) {
  await ensureBootstrap();
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.id));
}

export async function listOrdersWithItems(userId: number) {
  await ensureBootstrap();
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.id));
  const ids = rows.map((row) => row.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)).orderBy(orderItems.id)
    : [];
  return rows.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));
}

export async function getOrderWithItems(orderId: number) {
  await ensureBootstrap();
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (rows.length === 0) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.id);
  return { order: rows[0], items };
}

export async function listAllOrders(limit = 50) {
  await ensureBootstrap();
  const rows = await db.select().from(orders).orderBy(desc(orders.id)).limit(limit);
  const ids = rows.map((row) => row.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];
  return rows.map((order) => ({
    ...order,
    itemCount: items
      .filter((item) => item.orderId === order.id)
      .reduce((sum, item) => sum + item.quantity, 0),
  }));
}

export async function updateOrderStatus(orderId: number, status: string) {
  await ensureBootstrap();
  const [row] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
  return row ?? null;
}

export async function addReview(input: {
  productId: number;
  userId: number | null;
  author: string;
  rating: number;
  title?: string | null;
  body: string;
}) {
  await ensureBootstrap();
  await db.insert(reviews).values({
    productId: input.productId,
    userId: input.userId,
    author: input.author,
    rating: input.rating,
    title: input.title ?? null,
    body: input.body,
    verified: Boolean(input.userId),
  });
  await db.execute(sql`
    update products p set
      rating = coalesce((select round(avg(r.rating)::numeric, 2) from reviews r where r.product_id = p.id), 0),
      review_count = (select count(*)::int from reviews r where r.product_id = p.id)
    where p.id = ${input.productId}
  `);
}

export async function getAdminStats() {
  await ensureBootstrap();
  const [orderAgg] = await db
    .select({
      ordersCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(total), 0)::float`,
      items: sql<number>`coalesce(sum(subtotal), 0)::float`,
    })
    .from(orders);

  const [productAgg] = await db
    .select({
      productsCount: sql<number>`count(*)::int`,
      lowStock: sql<number>`count(*) filter (where stock < 20)::int`,
      outOfStock: sql<number>`count(*) filter (where stock = 0)::int`,
    })
    .from(products);

  const [customerAgg] = await db
    .select({
      customers: sql<number>`count(*)::int`,
      admins: sql<number>`count(*) filter (where role = 'admin')::int`,
    })
    .from(users);

  const [reviewAgg] = await db.select({ total: sql<number>`count(*)::int` }).from(reviews);

  const statusRows = await db
    .select({ status: orders.status, count: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);

  const dailyResult = await db.execute(sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*)::int as orders,
           coalesce(sum(total), 0)::float as revenue
    from orders
    where created_at >= now() - interval '14 days'
    group by 1
    order by 1
  `);
  const dailyRows = (
    Array.isArray(dailyResult) ? dailyResult : (dailyResult as { rows?: unknown[] }).rows ?? []
  ) as Array<{ day: string; orders: number; revenue: number }>;

  const topProducts = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      sold: products.sold,
      stock: products.stock,
      price: products.price,
      image: products.image,
    })
    .from(products)
    .orderBy(desc(products.sold))
    .limit(6);

  return {
    ordersCount: orderAgg.ordersCount,
    revenue: orderAgg.revenue,
    productsCount: productAgg.productsCount,
    lowStock: productAgg.lowStock,
    outOfStock: productAgg.outOfStock,
    customers: customerAgg.customers,
    reviewsCount: reviewAgg.total,
    statusRows,
    daily: dailyRows,
    topProducts,
  };
}

export async function listProductsAdmin(filter: { q?: string; limit?: number; offset?: number } = {}) {
  await ensureBootstrap();
  const conditions: SQL[] = [];
  if (filter.q) {
    const like = `%${filter.q}%`;
    conditions.push(or(ilike(products.title, like), ilike(products.brand, like))!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db
    .select({
      ...productColumns,
      description: products.description,
      bullets: products.bullets,
      gallery: products.gallery,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(where)
    .orderBy(desc(products.id))
    .limit(filter.limit ?? 200)
    .offset(filter.offset ?? 0);
  return rows;
}

export async function getHomeData() {
  await ensureBootstrap();
  const [featured, deals, bestSellers, newArrivals, cats] = await Promise.all([
    searchProducts({ featured: true, sort: "bestselling", limit: 8 }),
    searchProducts({ sort: "discount", inStock: true, limit: 8 }),
    searchProducts({ sort: "bestselling", limit: 8 }),
    searchProducts({ sort: "newest", limit: 8 }),
    listCategories(),
  ]);
  return {
    featured: featured.items,
    deals: deals.items,
    bestSellers: bestSellers.items,
    newArrivals: newArrivals.items,
    categories: cats,
  };
}
