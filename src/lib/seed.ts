import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { categories, orderItems, orders, products, reviews, users } from "@/db/schema";
import { shippingFor } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { CATEGORIES, PRODUCTS, REVIEWERS, REVIEW_POOL, px } from "@/lib/seed-data";

export const DEMO_ADMIN_EMAIL = "admin@qafila.store";
export const DEFAULT_ADMIN_PASSWORD = "admin1234";
export const DEMO_USER_EMAIL = "demo@qafila.store";
export const DEMO_USER_PASSWORD = "demo1234";

const DAY = 86400_000;

/** Deterministic pseudo-random generator so the demo catalogue is stable. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

async function runSeed() {
  await ensureSchema();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(categories);
  if (n > 0) return;

  const adminHash = await hashPassword(process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD);
  const demoHash = await hashPassword(DEMO_USER_PASSWORD);
  const now = Date.now();

  await db.transaction(async (tx) => {
    // Serialise concurrent first requests so the catalogue is inserted once.
    await tx.execute(sql`select pg_advisory_xact_lock(7243115)`);
    const [{ n: again }] = await tx.select({ n: sql<number>`count(*)::int` }).from(categories);
    if (again > 0) return;

    const catRows = await tx
      .insert(categories)
      .values(
        CATEGORIES.map((c, i) => ({
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          image: px(c.image, 500),
          sort: i,
        })),
      )
      .returning({ id: categories.id, slug: categories.slug });
    const catId = new Map(catRows.map((r) => [r.slug, r.id]));

    const prodRows = await tx
      .insert(products)
      .values(
        PRODUCTS.map((p, i) => ({
          slug: p.slug,
          title: p.title,
          brand: p.brand,
          description: p.desc,
          features: p.features,
          specs: p.specs.map(([label, value]) => ({ label, value })),
          images: p.imgs.map((id) => px(id)),
          price: p.price * 100,
          listPrice: p.list ? p.list * 100 : null,
          categoryId: catId.get(p.cat)!,
          stock: p.stock,
          soldCount: p.sold,
          isDeal: Boolean(p.deal),
          express: Boolean(p.express),
          createdAt: new Date(now - (((i * 13) % PRODUCTS.length) + 1) * DAY),
        })),
      )
      .returning({
        id: products.id,
        slug: products.slug,
        title: products.title,
        price: products.price,
        images: products.images,
      });

    await tx.insert(users).values({
      name: "مدير المتجر",
      email: DEMO_ADMIN_EMAIL,
      passwordHash: adminHash,
      role: "admin",
    });
    const [demo] = await tx
      .insert(users)
      .values({ name: "سلمان الغامدي", email: DEMO_USER_EMAIL, passwordHash: demoHash })
      .returning({ id: users.id });

    // Reviewer accounts exist only to own the sample reviews; they cannot sign in.
    const reviewerRows = await tx
      .insert(users)
      .values(
        REVIEWERS.map((name, i) => ({
          name,
          email: `reviewer${i + 1}@seed.qafila.store`,
          passwordHash: `disabled$${randomBytes(8).toString("hex")}`,
        })),
      )
      .returning({ id: users.id });
    const reviewerIds = reviewerRows.map((r) => r.id);

    const reviewValues: (typeof reviews.$inferInsert)[] = [];
    prodRows.forEach((p, i) => {
      const rand = rng(i * 97 + 11);
      const count = 3 + Math.floor(rand() * 4);
      const start = Math.floor(rand() * reviewerIds.length);
      for (let k = 0; k < count; k++) {
        const roll = rand();
        const rating = roll < 0.55 ? 5 : roll < 0.85 ? 4 : roll < 0.95 ? 3 : 2;
        const pool = REVIEW_POOL[rating];
        const text = pool[Math.floor(rand() * pool.length)];
        reviewValues.push({
          productId: p.id,
          userId: reviewerIds[(start + k) % reviewerIds.length],
          rating,
          title: text.title,
          body: text.body,
          createdAt: new Date(now - Math.floor(1 + rand() * 120) * DAY),
        });
      }
    });
    await tx.insert(reviews).values(reviewValues);
    await tx.execute(sql`
      update products p
      set rating_avg = s.avg, rating_count = s.n
      from (
        select product_id, avg(rating)::real as avg, count(*)::int as n
        from reviews group by product_id
      ) s
      where s.product_id = p.id
    `);

    // A few sample orders so the account and admin screens have something to show.
    const bySlug = new Map(prodRows.map((p) => [p.slug, p]));
    const demoOrders: {
      number: string;
      status: string;
      daysAgo: number;
      items: [string, number][];
    }[] = [
      {
        number: "QF-482913075",
        status: "delivered",
        daysAgo: 12,
        items: [
          ["sonar-anc-headphones", 1],
          ["azm-sport-water-bottle", 2],
        ],
      },
      {
        number: "QF-615540298",
        status: "shipped",
        daysAgo: 2,
        items: [["mihmas-barista-espresso", 1]],
      },
      {
        number: "QF-730218864",
        status: "processing",
        daysAgo: 0.1,
        items: [
          ["khuta-run-sneakers", 1],
          ["ittizan-yoga-mat", 1],
        ],
      },
    ];
    for (const o of demoOrders) {
      const lines = o.items.map(([slug, quantity]) => ({ product: bySlug.get(slug)!, quantity }));
      const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
      const shippingFee = shippingFor(subtotal);
      const [order] = await tx
        .insert(orders)
        .values({
          number: o.number,
          userId: demo.id,
          status: o.status,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentMethod: "cod",
          shipName: "سلمان الغامدي",
          shipPhone: "0551234567",
          shipCity: "الرياض",
          shipDistrict: "حي الملقا",
          shipStreet: "شارع أنس بن مالك، مبنى 12",
          createdAt: new Date(now - o.daysAgo * DAY),
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.product.id,
          title: l.product.title,
          image: l.product.images[0] ?? "",
          price: l.product.price,
          quantity: l.quantity,
        })),
      );
    }
  });
}

const globalForSeed = globalThis as typeof globalThis & { __qafilaSeed?: Promise<void> };

/**
 * Creates the schema if missing and fills an empty database with the demo
 * catalogue. Cheap after the first call.
 */
export function ensureSeeded(): Promise<void> {
  if (!globalForSeed.__qafilaSeed) {
    globalForSeed.__qafilaSeed = runSeed().catch((err) => {
      globalForSeed.__qafilaSeed = undefined;
      throw err;
    });
  }
  return globalForSeed.__qafilaSeed;
}
