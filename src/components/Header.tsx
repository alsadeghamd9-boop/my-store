import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Heart, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import Logo from "@/components/Logo";
import SearchBar from "@/components/SearchBar";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { itemsLabel } from "@/lib/format";
import { getCategories } from "@/lib/queries";

export default async function Header() {
  const [user, cart, categories] = await Promise.all([getCurrentUser(), getCart(), getCategories()]);
  return <header id="top" className="relative z-30 bg-white">
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">تخطَّ إلى المحتوى</a>
    <div className="bg-ink-900 text-white"><div className="container-page flex min-h-9 items-center justify-center gap-2 text-center text-[11px] sm:justify-between sm:text-xs"><span className="flex items-center gap-2"><Sparkles size={13} className="text-saffron-300" /> من السودان، لكل السودان <span className="hidden sm:inline">— تسوّق على كيفك</span></span><span className="hidden items-center gap-1.5 text-white/80 sm:flex"><MapPin size={13} /> التوصيل لجميع الولايات</span></div></div>
    <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-3 py-4 lg:flex-nowrap lg:gap-10"><Logo /><div className="order-last w-full lg:order-none lg:max-w-[570px] lg:flex-1"><Suspense fallback={<div className="h-11 rounded-full bg-paper" />}><SearchBar categories={categories.map(({ slug, name }) => ({ slug, name }))} /></Suspense></div>
      <div className="ms-auto flex items-center gap-0.5 sm:gap-2"><AccountMenu user={user ? { name: user.name, role: user.role } : null} /><Link href="/wishlist" aria-label="المفضلة" className="hidden rounded-full p-2.5 text-ink-900 hover:bg-paper sm:block"><Heart size={20} /></Link><Link href="/cart" aria-label={`سلة التسوق: ${itemsLabel(cart.count)}`} className="flex items-center gap-2 rounded-full p-2.5 text-ink-900 hover:bg-paper"><span className="relative"><ShoppingBag size={21} /><span className="absolute -end-2 -top-2 grid size-[17px] place-items-center rounded-full bg-terracotta text-[10px] font-bold text-white">{cart.count}</span></span><span className="hidden text-sm font-semibold md:inline">السلة</span></Link></div>
    </div>
    <nav aria-label="التنقل في المتجر" className="border-t border-line"><ul className="container-page no-scrollbar flex items-center gap-6 overflow-x-auto py-3 text-[13px] font-medium text-muted sm:gap-8"><li><Link href="/" className="whitespace-nowrap text-ink-900 hover:text-terracotta">الرئيسية</Link></li><li><Link href="/search" className="flex items-center gap-1 whitespace-nowrap text-ink-900 hover:text-terracotta">كل المنتجات <ChevronDown size={13} /></Link></li>{categories.slice(0, 6).map((category) => <li key={category.id}><Link href={`/categories/${category.slug}`} className="whitespace-nowrap hover:text-ink-900">{category.name}</Link></li>)}<li className="ms-auto"><Link href="/help" className="whitespace-nowrap hover:text-ink-900">المساعدة</Link></li></ul></nav>
  </header>;
}
