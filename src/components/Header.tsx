import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { listCategories } from "@/db/queries";
import SearchBar from "@/components/SearchBar";
import CartButton from "@/components/CartButton";
import AccountMenu from "@/components/AccountMenu";
import Toasts from "@/components/Toasts";
import { BoxIcon, MenuIcon, PinIcon, SparkIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Header() {
  let user: SessionUser | null = null;
  let cats: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  try {
    cats = await listCategories();
  } catch {
    cats = [];
  }

  const navCategories = cats.map((category) => ({
    name: category.name,
    slug: category.slug,
  }));

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <a
            href="/"
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition hover:outline hover:outline-1 hover:outline-white/40"
          >
            <span className="text-xl leading-none font-black tracking-tight sm:text-2xl">
              سوق<span className="text-gold-400">.sa</span>
            </span>
            <svg viewBox="0 0 60 14" className="h-2.5 w-10 text-gold-400" aria-hidden="true">
              <path
                d="M2 4c14 8 40 8 54 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </a>

          <div className="hidden shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs transition hover:outline hover:outline-1 hover:outline-white/40 lg:flex">
            <PinIcon width={16} height={16} className="text-gold-400" />
            <span className="leading-tight">
              <span className="block text-white/60">التوصيل إلى</span>
              <span className="block font-bold">الرياض 12271</span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <SearchBar categories={navCategories} />
          </div>

          <AccountMenu
            user={
              user
                ? { name: user.name, email: user.email, role: user.role }
                : null
            }
          />

          <a
            href="/orders"
            className="hidden shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs leading-tight transition hover:outline hover:outline-1 hover:outline-white/40 md:flex"
          >
            <BoxIcon width={18} height={18} className="text-gold-400" />
            <span>
              <span className="block text-white/60">مرتجعاتك</span>
              <span className="block font-bold">وطلباتك</span>
            </span>
          </a>

          <CartButton />
        </div>
      </div>

      <div className="bg-ink-800 text-white">
        <div className="no-scrollbar mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-3 py-1.5 text-sm sm:px-4">
          <a
            href="/products"
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-bold transition hover:outline hover:outline-1 hover:outline-white/40"
          >
            <MenuIcon width={16} height={16} />
            كل الأقسام
          </a>
          {navCategories.map((category) => (
            <a
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="shrink-0 rounded-md px-2 py-1 text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {category.name}
            </a>
          ))}
          <a
            href="/products?sort=discount"
            className="flex shrink-0 items-center gap-1 rounded-md bg-gold-400/15 px-2 py-1 font-bold text-gold-300 transition hover:bg-gold-400/25"
          >
            <SparkIcon width={15} height={15} />
            عروض اليوم
          </a>
          <a
            href="/products?sort=bestselling"
            className="hidden shrink-0 rounded-md px-2 py-1 text-white/85 transition hover:bg-white/10 hover:text-white sm:block"
          >
            الأكثر مبيعًا
          </a>
          <a
            href="/products?perPage=24"
            className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-white/85 transition hover:bg-white/10 hover:text-white lg:flex"
          >
            <TruckIcon width={15} height={15} />
            شحن مجاني فوق 300 ر.س
          </a>
        </div>
      </div>
      <Toasts />
    </header>
  );
}
