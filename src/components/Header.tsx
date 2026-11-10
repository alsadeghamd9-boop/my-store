import Link from "next/link";
import { Suspense } from "react";
import { Package, ShoppingCart, Tag, Zap } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import Logo from "@/components/Logo";
import SearchBar from "@/components/SearchBar";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { itemsLabel } from "@/lib/format";
import { getCategories } from "@/lib/queries";

const navLink =
  "flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap text-ink-100 hover:bg-white/10 hover:text-white";

export default async function Header() {
  const [user, cart, cats] = await Promise.all([getCurrentUser(), getCart(), getCategories()]);

  return (
    <header id="top" className="on-dark bg-ink-900 text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-saffron-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
      >
        تخطَّ إلى المحتوى
      </a>

      <p className="bg-ink-950 px-3 py-1.5 text-center text-xs text-ink-100">
        توصيل مجاني للطلبات فوق 200 ر.س · الدفع عند الاستلام متاح
      </p>

      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-3 py-3 lg:flex-nowrap lg:gap-6">
        <Logo />

        <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
          <Suspense fallback={<div className="h-11 rounded-full bg-white/10" />}>
            <SearchBar categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
          </Suspense>
        </div>

        <div className="ms-auto flex items-center gap-0.5 sm:gap-1.5 lg:ms-0">
          <AccountMenu user={user ? { name: user.name, role: user.role } : null} />
          <Link
            href="/orders"
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 md:flex"
          >
            <Package size={20} aria-hidden="true" />
            طلباتي
          </Link>
          <Link
            href="/cart"
            aria-label={`سلة التسوق: ${itemsLabel(cart.count)}`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-white hover:bg-white/10"
          >
            <span className="relative">
              <ShoppingCart size={24} aria-hidden="true" />
              <span
                className="absolute -end-2.5 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-500 px-1 text-xs leading-none font-bold text-ink-950"
                aria-hidden="true"
              >
                {cart.count}
              </span>
            </span>
            <span className="hidden text-sm font-medium sm:inline">السلة</span>
          </Link>
        </div>
      </div>

      <nav aria-label="أقسام المتجر" className="bg-ink-800">
        <ul className="no-scrollbar container-page flex items-center gap-0.5 overflow-x-auto py-1.5 text-sm">
          <li>
            <Link href="/search" className={navLink}>
              كل المنتجات
            </Link>
          </li>
          <li>
            <Link href="/search?deal=1" className={`${navLink} font-semibold !text-saffron-300`}>
              <Tag size={15} aria-hidden="true" />
              عروض اليوم
            </Link>
          </li>
          <li>
            <Link href="/search?express=1" className={navLink}>
              <Zap size={15} aria-hidden="true" />
              إكسبرس
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/search?category=${c.slug}`} className={navLink}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
