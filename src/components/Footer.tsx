import Link from "next/link";
import { ArrowUp } from "lucide-react";
import Logo from "@/components/Logo";
import { getCategories } from "@/lib/queries";

const link = "text-ink-100 hover:text-white hover:underline";

export default async function Footer() {
  const cats = await getCategories();
  return (
    <footer className="on-dark mt-14 bg-ink-900 text-ink-100">
      <a
        href="#top"
        className="flex items-center justify-center gap-2 bg-ink-800 py-3 text-sm text-white hover:bg-ink-700"
      >
        <ArrowUp size={15} aria-hidden="true" />
        العودة إلى الأعلى
      </a>

      <div className="container-page grid gap-x-8 gap-y-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            متجر واحد للإلكترونيات والأزياء ومستلزمات البيت، بتوصيل سريع ودفع عند الاستلام وإرجاع
            سهل.
          </p>
        </div>

        <nav aria-label="تسوّق حسب القسم">
          <h2 className="text-sm font-bold text-white">تسوّق حسب القسم</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/search?category=${c.slug}`} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="حسابك">
          <h2 className="text-sm font-bold text-white">حسابك</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/account" className={link}>
                حسابي
              </Link>
            </li>
            <li>
              <Link href="/orders" className={link}>
                طلباتي
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className={link}>
                المفضلة
              </Link>
            </li>
            <li>
              <Link href="/cart" className={link}>
                سلة التسوق
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="المساعدة">
          <h2 className="text-sm font-bold text-white">المساعدة</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/help#shipping" className={link}>
                الشحن والتوصيل
              </Link>
            </li>
            <li>
              <Link href="/help#payment" className={link}>
                طرق الدفع
              </Link>
            </li>
            <li>
              <Link href="/help#returns" className={link}>
                الإرجاع والاستبدال
              </Link>
            </li>
            <li>
              <Link href="/help#account" className={link}>
                الحساب والطلبات
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <p className="border-t border-white/10 px-3 py-4 text-center text-xs">
        © {new Date().getFullYear()} قافلة. الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة.
      </p>
    </footer>
  );
}
