import BackToTop from "@/components/BackToTop";
import { ReturnIcon, ShieldIcon, TruckIcon, SparkIcon } from "@/components/icons";

const columns = [
  {
    title: "تعرّف علينا",
    links: [
      { label: "من نحن", href: "/products?sort=bestselling" },
      { label: "الوظائف", href: "/products?sort=newest" },
      { label: "الاستدامة", href: "/products?category=home-kitchen" },
      { label: "الأخبار", href: "/products?sort=discount" },
    ],
  },
  {
    title: "تسوّق حسب القسم",
    links: [
      { label: "الإلكترونيات", href: "/products?category=electronics" },
      { label: "الأزياء", href: "/products?category=fashion" },
      { label: "المنزل والمطبخ", href: "/products?category=home-kitchen" },
      { label: "الجمال والعناية", href: "/products?category=beauty" },
      { label: "الكتب والمكتبة", href: "/products?category=books" },
    ],
  },
  {
    title: "خدمة العملاء",
    links: [
      { label: "مركز المساعدة", href: "/orders" },
      { label: "تتبع طلبك", href: "/orders" },
      { label: "الشحن والتوصيل", href: "/products?perPage=24" },
      { label: "الإرجاع والاستبدال", href: "/orders" },
    ],
  },
  {
    title: "حسابي",
    links: [
      { label: "تسجيل الدخول", href: "/account" },
      { label: "طلباتي", href: "/orders" },
      { label: "المفضلة", href: "/wishlist" },
      { label: "سلة التسوق", href: "/cart" },
    ],
  },
];

const perks = [
  { icon: TruckIcon, title: "شحن سريع", text: "توصيل خلال 24-48 ساعة لجميع المدن" },
  { icon: ReturnIcon, title: "إرجاع مجاني", text: "خلال 15 يومًا من الاستلام" },
  { icon: ShieldIcon, title: "دفع آمن", text: "حماية كاملة لبياناتك وعملياتك" },
  { icon: SparkIcon, title: "عروض يومية", text: "خصومات حتى 50% على آلاف المنتجات" },
];

export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-200/60 text-gold-600">
                <perk.icon width={22} height={22} />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-ink-900">{perk.title}</span>
                <span className="block text-xs text-slate-500">{perk.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-ink-900 text-white">
        <BackToTop />
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-sm font-extrabold text-gold-300">{column.title}</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition hover:text-white hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/60 sm:flex-row">
            <p className="flex items-center gap-2">
              <span className="text-base font-black text-white">
                سوق<span className="text-gold-400">.sa</span>
              </span>
              © {new Date().getFullYear()} جميع الحقوق محفوظة
            </p>
            <p className="flex flex-wrap items-center justify-center gap-3">
              <span className="rounded bg-white/10 px-2 py-1 font-bold">Visa</span>
              <span className="rounded bg-white/10 px-2 py-1 font-bold">Mastercard</span>
              <span className="rounded bg-white/10 px-2 py-1 font-bold">مدى</span>
              <span className="rounded bg-white/10 px-2 py-1 font-bold">Apple Pay</span>
              <span className="rounded bg-white/10 px-2 py-1 font-bold">الدفع عند الاستلام</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
