import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { ExpressBadge } from "@/components/Badges";
import Price from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import Stars from "@/components/Stars";
import WishlistButton from "@/components/WishlistButton";
import { discountPercent, formatCount, formatPrice } from "@/lib/format";
import { getWishlistIds, type ProductCardData } from "@/lib/queries";

export default async function ProductCard({ product }: { product: ProductCardData }) {
  const wishlist = await getWishlistIds();
  const off = discountPercent(product.price, product.listPrice);
  const out = product.stock <= 0;
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-white p-2.5 transition-shadow hover:shadow-[0_14px_34px_-14px_rgba(11,42,47,0.35)] sm:p-3">
      <div className="relative">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="block overflow-hidden rounded-xl bg-paper"
        >
          <SmartImage
            src={product.images[0]}
            alt=""
            className={`aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${
              out ? "opacity-60 grayscale" : ""
            }`}
          />
        </Link>
        {off > 0 && (
          <span className="absolute start-2 top-2 rounded-md bg-deal px-1.5 py-0.5 text-xs font-bold text-white">
            خصم {off}%
          </span>
        )}
        <div className="absolute end-2 top-2">
          <WishlistButton productId={product.id} initialSaved={wishlist.has(product.id)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        {product.brand && <p className="text-xs text-muted">{product.brand}</p>}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.6rem] font-sans text-sm leading-snug font-medium text-body">
          <Link href={href} className="hover:text-ink-700 hover:underline">
            {product.title}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          {product.ratingCount > 0 ? (
            <>
              <Stars value={product.ratingAvg} size={14} />
              <span dir="ltr">({formatCount(product.ratingCount)})</span>
            </>
          ) : (
            <span>لا تقييمات بعد</span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Price value={product.price} />
          {off > 0 && product.listPrice && (
            <span className="text-xs text-muted">
              <span className="sr-only">السعر السابق </span>
              <span dir="ltr" className="line-through">
                {formatPrice(product.listPrice)}
              </span>
            </span>
          )}
        </div>

        <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
          {product.express && !out && <ExpressBadge />}
          {!out && product.stock <= 5 && (
            <span className="text-xs font-semibold text-deal">بقي {product.stock} فقط</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <AddToCartButton productId={product.id} outOfStock={out} />
        </div>
      </div>
    </article>
  );
}
