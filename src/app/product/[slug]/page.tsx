import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetail, { type DetailProduct } from "@/components/ProductDetail";
import ReviewSection from "@/components/ReviewSection";
import ProductRail from "@/components/ProductRail";
import { SectionHeading } from "@/components/ui";
import { getProductBySlug, listReviews, searchProducts } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "المنتج غير موجود | سوق" };
  return {
    title: `${product.title} | سوق`,
    description: `${product.description.slice(0, 150)} — السعر ${formatPrice(product.price)}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, user] = await Promise.all([
    listReviews(product.id),
    searchProducts({
      category: product.categorySlug ?? undefined,
      excludeId: product.id,
      sort: "bestselling",
      limit: 8,
    }),
    getCurrentUser().catch(() => null),
  ]);

  const detail: DetailProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    description: product.description,
    bullets: product.bullets ?? [],
    price: product.price,
    oldPrice: product.oldPrice,
    stock: product.stock,
    sold: product.sold,
    rating: product.rating,
    reviewCount: product.reviewCount,
    image: product.image,
    gallery: product.gallery ?? [],
    fastShipping: product.fastShipping,
    categoryName: product.categoryName,
    categorySlug: product.categorySlug,
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-gold-600">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gold-600">
          المنتجات
        </Link>
        {product.categorySlug && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-gold-600">
              {product.categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="line-clamp-1 font-bold text-ink-800">{product.title}</span>
      </nav>

      <ProductDetail product={detail} />

      <div className="card p-4 sm:p-5">
        <SectionHeading title="منتجات ذات صلة" subtitle="قد يعجبك أيضًا من نفس القسم" />
        {related.items.length > 0 ? (
          <ProductRail products={related.items} compact />
        ) : (
          <p className="text-sm text-slate-500">لا توجد منتجات ذات صلة حاليًا.</p>
        )}
      </div>

      <ReviewSection
        productId={product.id}
        initialReviews={reviews.map((review) => ({
          id: review.id,
          author: review.author,
          rating: review.rating,
          title: review.title,
          body: review.body,
          verified: review.verified,
          createdAt: review.createdAt.toISOString(),
        }))}
        initialRating={product.rating}
        signedInName={user?.name ?? null}
      />
    </div>
  );
}
