import Link from "next/link";
import { MapPin, MoveUp, Truck } from "lucide-react";
import Logo from "@/components/Logo";
import { getCategories } from "@/lib/queries";

export default async function Footer() {
  const categories = await getCategories();
  return <footer className="on-dark mt-16 bg-ink-950 text-white"><div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:py-16"><div><Logo light /><p className="mt-5 max-w-xs text-sm leading-7 text-white/65">مكان واحد يجمع حاجاتنا الجميلة. اختيارات ليك ولبيتك، من قلب السودان.</p><p className="mt-5 flex items-center gap-2 text-xs text-saffron-300"><MapPin size={15} /> بكل محبة، من السودان</p></div>
    <nav aria-label="أقسام المتجر"><h2 className="text-sm font-bold">تسوّق</h2><ul className="mt-5 space-y-3 text-sm text-white/65"><li><Link href="/search" className="hover:text-white">كل المنتجات</Link></li>{categories.slice(0, 4).map((category) => <li key={category.id}><Link href={`/categories/${category.slug}`} className="hover:text-white">{category.name}</Link></li>)}</ul></nav>
    <nav aria-label="روابط المساعدة"><h2 className="text-sm font-bold">نحن هنا لمساعدتك</h2><ul className="mt-5 space-y-3 text-sm text-white/65"><li><Link href="/help#shipping" className="hover:text-white">الشحن والتوصيل</Link></li><li><Link href="/help#payment" className="hover:text-white">طرق الدفع</Link></li><li><Link href="/help#returns" className="hover:text-white">الإرجاع والاستبدال</Link></li><li><Link href="/help" className="hover:text-white">الأسئلة الشائعة</Link></li></ul></nav>
    <div><h2 className="text-sm font-bold">تسوق براحتك</h2><p className="mt-5 flex items-start gap-2 text-sm leading-7 text-white/65"><Truck size={17} className="mt-1 shrink-0 text-saffron-300" /> التوصيل متاح لجميع ولايات السودان</p><Link href="/cart" className="mt-4 inline-block text-sm text-saffron-300 hover:underline">سلة التسوق</Link></div>
  </div><div className="border-t border-white/10"><div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-white/50"><p>© {new Date().getFullYear()} سوق السودان. بكل فخر سوداني.</p><div className="flex items-center gap-5"><span>جميع الأسعار بالجنيه السوداني</span><a href="#top" className="flex items-center gap-1 text-white/75 hover:text-white">للأعلى <MoveUp size={14} /></a></div></div></div></footer>;
}
