export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Package, RotateCcw, Truck } from "lucide-react";
import { Money } from "@/components/Price";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

export const metadata: Metadata = { title: "المساعدة", description: "معلومات الشحن والدفع والطلبات في سوق السودان." };
export default function HelpPage() {
  const supportEmail = process.env.SUPPORT_EMAIL;
  return <div className="container-page py-9"><p className="text-xs font-semibold text-terracotta">دائماً معاك</p><h1 className="mt-2 text-3xl font-bold">كيف نساعدك؟</h1><p className="mt-2 text-sm text-muted">كل البتحتاج تعرفه عن التسوق من سوق السودان.</p>
    <div className="mt-8 grid max-w-4xl gap-4">
      <section id="shipping" className="card scroll-mt-5 p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Truck size={20} className="text-terracotta" /> الشحن والتوصيل</h2><p className="mt-3 text-sm leading-7 text-body">التوصيل متاح لجميع ولايات السودان. رسوم التوصيل <Money value={SHIPPING_FEE} /> للطلبات الأقل من <Money value={FREE_SHIPPING_THRESHOLD} />، ومجاني لما فوق ذلك. تظهر التكلفة قبل تأكيد الطلب، ويُحدّد موعد التوصيل عند التواصل معك.</p></section>
      <section id="payment" className="card scroll-mt-5 p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Banknote size={20} className="text-terracotta" /> طرق الدفع</h2><p className="mt-3 text-sm leading-7 text-body">يمكنك الدفع عند الاستلام أو عبر تحويل بنكي أو محفظة mCash أو Zain Cash. يتم التحقق من التحويلات والمحافظ يدوياً؛ لا يحدث خصم تلقائي عند تقديم الطلب. كل الأسعار بالجنيه السوداني.</p></section>
      <section id="returns" className="card scroll-mt-5 p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><RotateCcw size={20} className="text-terracotta" /> الإلغاء والإرجاع</h2><p className="mt-3 text-sm leading-7 text-body">يمكنك إلغاء الطلب من صفحة تفاصيله قبل شحنه. للاستفسار عن شروط الإرجاع والاستبدال بعد الاستلام، تواصل مع المتجر مع ذكر رقم الطلب.{supportEmail && <> راسلنا على <a className="text-ink-700 underline" href={`mailto:${supportEmail}`} dir="ltr">{supportEmail}</a>.</>}</p></section>
      <section id="account" className="card scroll-mt-5 p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Package size={20} className="text-terracotta" /> الحساب والطلبات</h2><p className="mt-3 text-sm leading-7 text-body">يمكنك الشراء دون إنشاء حساب، ومتابعة طلب الزائر من صفحة التأكيد على نفس المتصفح لمدة 30 يوماً. أو <Link href="/register" className="font-semibold text-ink-700 underline">أنشئ حساباً</Link> لتجميع طلباتك ومفضلتك.</p></section>
    </div></div>;
}
