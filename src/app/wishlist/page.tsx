export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getDb } from "@/db";
import { products, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { itemsLabel } from "@/lib/format";
import { cardFields } from "@/lib/queries";

export const metadata: Metadata = { title: "المفضلة" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wishlist");

  const items = await getDb().select(cardFields)
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(and(eq(wishlistItems.userId, user.id), eq(products.active, true)))
    .orderBy(desc(wishlistItems.createdAt));

  return (
    <div className="container-page py-5">
      <h1 className="text-2xl font-bold text-ink-950">المفضلة</h1>

      {items.length === 0 ? (
        <div className="card mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-saffron-100 text-ink-900">
            <Heart size={30} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-950">لم تحفظ أي منتج بعد</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            اضغط على رمز القلب في أي منتج لتحفظه هنا وتعود إليه لاحقاً.
          </p>
          <Link href="/search" className="btn btn-primary mt-6">
            تصفّح المنتجات
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">{itemsLabel(items.length)} محفوظة</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
