import { sql } from "drizzle-orm";
import { db } from "@/db";
import { hashPassword } from "@/lib/password";
import { seedCategories, seedProducts, seedReviews } from "@/db/seed-data";

const DDL = [
  `create table if not exists users (
     id serial primary key,
     name text not null,
     email text not null constraint users_email_unique unique,
     phone text,
     password_hash text not null,
     role text not null default 'customer',
     city text,
     address text,
     created_at timestamp not null default now()
   )`,
  `create index if not exists users_email_idx on users (email)`,
  `create table if not exists sessions (
     id text primary key,
     user_id integer references users(id) on delete cascade,
     created_at timestamp not null default now()
   )`,
  `create index if not exists sessions_user_idx on sessions (user_id)`,
  `create table if not exists categories (
     id serial primary key,
     name text not null,
     slug text not null constraint categories_slug_unique unique,
     tagline text,
     image text,
     sort_order integer not null default 0
   )`,
  `create table if not exists products (
     id serial primary key,
     title text not null,
     slug text not null constraint products_slug_unique unique,
     brand text,
     description text not null default '',
     bullets text[] not null default '{}'::text[],
     price numeric(12,2) not null,
     old_price numeric(12,2),
     stock integer not null default 0,
     sold integer not null default 0,
     rating double precision not null default 0,
     review_count integer not null default 0,
     image text not null,
     gallery text[] not null default '{}'::text[],
     category_id integer references categories(id) on delete set null,
     featured boolean not null default false,
     fast_shipping boolean not null default false,
     created_at timestamp not null default now()
   )`,
  `create index if not exists products_category_idx on products (category_id)`,
  `create index if not exists products_featured_idx on products (featured)`,
  `create index if not exists products_price_idx on products (price)`,
  `create table if not exists cart_items (
     id serial primary key,
     session_id text not null references sessions(id) on delete cascade,
     product_id integer not null references products(id) on delete cascade,
     quantity integer not null default 1,
     updated_at timestamp not null default now(),
     constraint cart_items_session_product_uq unique (session_id, product_id)
   )`,
  `create table if not exists wishlist_items (
     id serial primary key,
     session_id text not null references sessions(id) on delete cascade,
     product_id integer not null references products(id) on delete cascade,
     created_at timestamp not null default now(),
     constraint wishlist_session_product_uq unique (session_id, product_id)
   )`,
  `create table if not exists orders (
     id serial primary key,
     reference text not null constraint orders_reference_unique unique,
     user_id integer references users(id) on delete set null,
     full_name text not null,
     email text,
     phone text not null,
     city text not null,
     address text not null,
     notes text,
     payment_method text not null default 'cod',
     subtotal numeric(12,2) not null,
     shipping numeric(12,2) not null default 0,
     discount numeric(12,2) not null default 0,
     total numeric(12,2) not null,
     status text not null default 'pending',
     created_at timestamp not null default now()
   )`,
  `create index if not exists orders_user_idx on orders (user_id)`,
  `create index if not exists orders_status_idx on orders (status)`,
  `create table if not exists order_items (
     id serial primary key,
     order_id integer not null references orders(id) on delete cascade,
     product_id integer references products(id) on delete set null,
     title text not null,
     image text,
     price numeric(12,2) not null,
     quantity integer not null
   )`,
  `create index if not exists order_items_order_idx on order_items (order_id)`,
  `create table if not exists reviews (
     id serial primary key,
     product_id integer not null references products(id) on delete cascade,
     user_id integer references users(id) on delete set null,
     author text not null,
     rating integer not null,
     title text,
     body text not null default '',
     verified boolean not null default false,
     created_at timestamp not null default now()
   )`,
  `create index if not exists reviews_product_idx on reviews (product_id)`,
];

async function createSchema() {
  for (const statement of DDL) {
    await db.execute(sql.raw(statement));
  }
}

let bootstrapPromise: Promise<void> | null = null;

export function ensureBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

export async function bootstrap(): Promise<void> {
  await createSchema();
  await seed();
}

async function seed() {
  const { categories, products, reviews } = await import("@/db/schema");

  for (const category of seedCategories) {
    await db
      .insert(categories)
      .values({
        name: category.name,
        slug: category.slug,
        tagline: category.tagline,
        image: category.image,
        sortOrder: category.sortOrder,
      })
      .onConflictDoNothing();
  }

  const categoryRows = await db.select().from(categories);
  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

  const existing = await db.select({ slug: products.slug }).from(products);
  const existingSlugs = new Set(existing.map((row) => row.slug));

  for (const product of seedProducts) {
    if (existingSlugs.has(product.slug)) continue;
    await db.insert(products).values({
      title: product.title,
      slug: product.slug,
      brand: product.brand,
      description: product.description,
      bullets: product.bullets,
      price: product.price,
      oldPrice: product.oldPrice ?? null,
      stock: product.stock,
      sold: product.sold,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.image,
      gallery: product.gallery,
      categoryId: categoryIds.get(product.category) ?? null,
      featured: product.featured ?? false,
      fastShipping: product.fastShipping ?? false,
    });
  }

  const productRows = await db.select({ id: products.id, slug: products.slug }).from(products);
  const productIds = new Map(productRows.map((row) => [row.slug, row.id]));

  const existingReviews = await db.select({ id: reviews.id }).from(reviews).limit(1);
  if (existingReviews.length === 0) {
    for (const review of seedReviews) {
      const productId = productIds.get(review.product);
      if (!productId) continue;
      await db.insert(reviews).values({
        productId,
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        verified: true,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
      });
    }
  }

  // Admin account (idempotent)
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@souq.sa";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";
  await db.execute(sql`
    insert into users (name, email, password_hash, role, city, address)
    values ('مدير المتجر', ${adminEmail}, ${hashPassword(adminPassword)}, 'admin', 'الرياض', 'الإدارة العامة')
    on conflict (email) do nothing
  `);
}
