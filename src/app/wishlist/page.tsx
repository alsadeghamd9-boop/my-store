import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui";
import { getWishlist } from "@/db/queries";
import { readSessionId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المفضلة | سوق" };

export default async function WishlistPage() {
  const sessionId = await readSessionId();
  const items = await getWishlist(sessionId);

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-ink-900">قائمتي المفضلة</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length.toLocaleString("ar-SA-u-nu-latn")} منتج محفوظ — يمكنك الوصول إليها من أي جهاز
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات في المفضلة"
          description="اضغط على أيقونة القلب في أي منتج لحفظه هنا ومتابعة سعره لاحقًا."
          action={
            <Link href="/products" className="btn-gold rounded-full px-8 py-2.5 text-sm font-extrabold">
              اكتشف المنتجات
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
