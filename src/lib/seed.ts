import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { appSettings, categories, products, sessions, users } from "@/db/schema";
import { getAdminConfig } from "@/lib/admin-config";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * On first use, initialise the schema and make the environment the sole
 * authority for admin credentials. The lock protects concurrent cold starts.
 */
async function runSeed() {
  await ensureSchema();
  const admin = getAdminConfig();
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7243115)`);
    if (admin) {
      const [existing] = await tx.select().from(users).where(eq(users.email, admin.email)).limit(1);
      let adminId: number;
      if (existing) {
        const samePassword = existing.passwordHash.startsWith("$2") && await verifyPassword(admin.password, existing.passwordHash);
        adminId = existing.id;
        if (!samePassword || existing.role !== "admin") {
          await tx.update(users).set({ role: "admin", passwordHash: await hashPassword(admin.password) }).where(eq(users.id, adminId));
          await tx.delete(sessions).where(eq(sessions.userId, adminId));
        }
      } else {
        const [created] = await tx.insert(users).values({
          name: "مدير المتجر",
          email: admin.email,
          passwordHash: await hashPassword(admin.password),
          role: "admin",
        }).returning({ id: users.id });
        adminId = created.id;
      }
      // Old admin accounts, including any previously shipped demo admin, must
      // not remain privileged or retain a known password/session after upgrade.
      const former = await tx.select({ id: users.id }).from(users)
        .where(and(eq(users.role, "admin"), ne(users.id, adminId)));
      if (former.length) {
        const ids = former.map(({ id }) => id);
        await tx.delete(sessions).where(inArray(sessions.userId, ids));
        await tx.update(users).set({ role: "customer", passwordHash: `disabled$${randomBytes(32).toString("hex")}` })
          .where(inArray(users.id, ids));
      }
    }

    // Optional, explicitly requested sample catalogue. No sample users,
    // reviews or orders. A marker prevents re-creating deleted sample data.
    if (process.env.SEED_SAMPLE_DATA === "true") {
      const [marker] = await tx.select().from(appSettings).where(eq(appSettings.key, "sample_catalogue_v1"));
      if (!marker) {
        const [count] = await tx.select({ n: sql<number>`count(*)::int` }).from(categories);
        if (count.n === 0) {
          const inserted = await tx.insert(categories).values([
            { slug: "home", name: "البيت والحرف", tagline: "لمسة دافئة لبيتك", image: "/images/sample-basket.jpg", sort: 0 },
            { slug: "fashion", name: "الأزياء", tagline: "تفاصيل تشبهك", image: "/images/sample-scarf.jpg", sort: 1 },
            { slug: "beauty", name: "العناية والجمال", tagline: "عناية من الطبيعة", image: "/images/sample-oil.jpg", sort: 2 },
            { slug: "pantry", name: "المؤونة", tagline: "نكهات من أرضنا", image: "/images/sample-spices.jpg", sort: 3 },
          ]).returning({ id: categories.id, slug: categories.slug });
          const ids = new Map(inserted.map((category) => [category.slug, category.id]));
          await tx.insert(products).values([
            { slug: "woven-basket", title: "سلة خوص سودانية منسوجة يدوياً", brand: "حرف سودانية", description: "سلة خوص بتفاصيل منسوجة تضيف لمسة أصيلة إلى البيت.", images: ["/images/sample-basket.jpg"], price: 18500 * 100, listPrice: 22000 * 100, categoryId: ids.get("home")!, stock: 12, isDeal: true },
            { slug: "jebena-coffee-set", title: "طقم جبنة قهوة سودانية", brand: "من البيت السوداني", description: "جبنة فخارية مع فناجين لتحضير القهوة على الطريقة السودانية.", images: ["/images/sample-jebena.jpg"], price: 24500 * 100, categoryId: ids.get("home")!, stock: 8 },
            { slug: "cotton-scarf", title: "طرحة قطنية بتفاصيل منسوجة", brand: "نسيج", description: "قطعة ناعمة وعملية تضيف لمسة جميلة إلى إطلالتك اليومية.", images: ["/images/sample-scarf.jpg"], price: 12000 * 100, listPrice: 15000 * 100, categoryId: ids.get("fashion")!, stock: 15, isDeal: true },
            { slug: "natural-body-oil", title: "زيت طبيعي للعناية بالجسم", brand: "من الطبيعة", description: "زيت عناية للجسم بتركيبة خفيفة للاستخدام اليومي.", images: ["/images/sample-oil.jpg"], price: 9500 * 100, categoryId: ids.get("beauty")!, stock: 20 },
            { slug: "incense-burner", title: "مبخرة فخارية مع بخور عطري", brand: "رائحة الدار", description: "مبخرة فخارية تضفي أجواء دافئة على البيت.", images: ["/images/sample-incense.jpg"], price: 14500 * 100, categoryId: ids.get("beauty")!, stock: 9 },
            { slug: "sudanese-spice-blend", title: "خلطة بهارات سودانية مختارة", brand: "مذاق البلد", description: "خلطة بهارات غنية تضيف نكهة مميزة لأطباقك اليومية.", images: ["/images/sample-spices.jpg"], price: 6500 * 100, categoryId: ids.get("pantry")!, stock: 25 },
          ]);
        }
        await tx.insert(appSettings).values({ key: "sample_catalogue_v1", value: "done" }).onConflictDoNothing();
      }
    }
  });
}

const globalForSeed = globalThis as typeof globalThis & { __souqSeed?: Promise<void> };
export function ensureSeeded(): Promise<void> {
  if (!globalForSeed.__souqSeed) {
    globalForSeed.__souqSeed = runSeed().catch((error) => {
      globalForSeed.__souqSeed = undefined;
      throw error;
    });
  }
  return globalForSeed.__souqSeed;
}
