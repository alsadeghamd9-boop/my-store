import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
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
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_14px_35px_-22px_rgba(20,47,41,.35)]">
    <div className="relative overflow-hidden bg-[#f1eee8]"><Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true" className="block"><SmartImage src={product.images[0]} alt="" className={`aspect-[1/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${out ? "opacity-60 grayscale" : ""}`} /></Link>
      {off > 0 && <span className="absolute start-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-terracotta">خصم {off}%</span>}
      <div className="absolute end-3 top-3"><WishlistButton productId={product.id} initialSaved={wishlist.has(product.id)} /></div>
    </div>
    <div className="flex flex-1 flex-col p-3.5 sm:p-4"><p className="min-h-4 text-[11px] font-medium text-terracotta">{product.brand || "سوق السودان"}</p><h3 className="mt-1 min-h-[2.8rem] font-sans text-sm leading-6 font-semibold text-body sm:text-[15px]"><Link href={`/product/${product.slug}`} className="line-clamp-2 hover:text-ink-700">{product.title}</Link></h3>
      {product.ratingCount > 0 && <div className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Stars value={product.ratingAvg} size={13} /><span dir="ltr">({formatCount(product.ratingCount)})</span></div>}
      <div className="mt-3 flex flex-wrap items-baseline gap-2"><Price value={product.price} size="sm" />{off > 0 && product.listPrice && <span className="text-xs text-muted line-through" dir="ltr">{formatPrice(product.listPrice)} ج.س</span>}</div>
      <div className="mt-auto pt-4"><AddToCartButton productId={product.id} outOfStock={out} className="!border !border-ink-900/15 !bg-white !text-ink-900 hover:!bg-ink-900 hover:!text-white" /></div>
    </div>
  </article>;
}
