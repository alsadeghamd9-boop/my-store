import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Package, RotateCcw, Truck } from "lucide-react";
import { Money } from "@/components/Price";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "المساعدة",
  description: "الشحن والتوصيل، طرق الدفع، الإرجاع والاستبدال، وإدارة الطلبات في قافلة.",
};

export default function HelpPage() {
  const supportEmail = process.env.SUPPORT_EMAIL;

  const sections = [
    { id: "shipping", icon: Truck, title: "الشحن والتوصيل" },
    { id: "payment", icon: Banknote, title: "طرق الدفع" },
    { id: "returns", icon: RotateCcw, title: "الإرجاع والاستبدال" },
    { id: "account", icon: Package, title: "الحساب والطلبات" },
  ];

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">كيف نساعدك؟</h1>
      <p className="mt-2 max-w-2xl text-muted">
        إجابات مختصرة عن أكثر ما يسأل عنه عملاؤنا قبل الطلب وبعده.
      </p>

      <nav aria-label="أقسام المساعدة" className="mt-5">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {sections.map(({ id, icon: Icon, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="card flex items-center gap-3 p-4 text-sm font-semibold text-ink-950 transition-colors hover:border-ink-700"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-100 text-ink-900">
                  <Icon size={20} aria-hidden="true" />
                </span>
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 max-w-3xl space-y-5">
        <section id="shipping" className="card scroll-mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-ink-950">الشحن والتوصيل</h2>
          <dl className="mt-4 space-y-4 leading-relaxed">
            <div>
              <dt className="font-semibold text-ink-950">كم تكلفة التوصيل؟</dt>
              <dd className="mt-1 text-body">
                التوصيل مجاني للطلبات التي تبلغ <Money value={FREE_SHIPPING_THRESHOLD} /> أو أكثر،
                و<Money value={SHIPPING_FEE} /> لما دون ذلك. يظهر المبلغ بوضوح في السلة قبل تأكيد
                الطلب.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">متى يصل طلبي؟</dt>
              <dd className="mt-1 text-body">
                المنتجات التي تحمل شارة «إكسبرس» تُسلَّم في اليوم التالي داخل المدن الرئيسية. بقية
                المنتجات تصل خلال 2 إلى 4 أيام عمل.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">كيف أتابع الشحنة؟</dt>
              <dd className="mt-1 text-body">
                من صفحة{" "}
                <Link href="/orders" className="font-semibold text-ink-700 underline">
                  طلباتي
                </Link>{" "}
                تجد حالة كل طلب: قيد المراجعة، قيد التجهيز، تم الشحن، ثم تم التوصيل.
              </dd>
            </div>
          </dl>
        </section>

        <section id="payment" className="card scroll-mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-ink-950">طرق الدفع</h2>
          <dl className="mt-4 space-y-4 leading-relaxed">
            <div>
              <dt className="font-semibold text-ink-950">ما طرق الدفع المتاحة؟</dt>
              <dd className="mt-1 text-body">
                الدفع عند الاستلام نقداً للمندوب، بدون أي رسوم إضافية. الدفع بالبطاقات غير مفعّل
                حالياً.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">هل الأسعار تشمل الضريبة؟</dt>
              <dd className="mt-1 text-body">
                نعم، جميع الأسعار المعروضة بالريال السعودي وتشمل ضريبة القيمة المضافة.
              </dd>
            </div>
          </dl>
        </section>

        <section id="returns" className="card scroll-mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-ink-950">الإرجاع والاستبدال</h2>
          <dl className="mt-4 space-y-4 leading-relaxed">
            <div>
              <dt className="font-semibold text-ink-950">هل أستطيع إلغاء الطلب؟</dt>
              <dd className="mt-1 text-body">
                نعم، مجاناً ما دام الطلب لم يُشحن: افتح الطلب من صفحة «طلباتي» واضغط «إلغاء
                الطلب».
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">ما شروط الإرجاع بعد الاستلام؟</dt>
              <dd className="mt-1 text-body">
                يمكنك إرجاع المنتج خلال 15 يوماً من الاستلام إذا كان غير مستخدم وفي عبوته الأصلية
                مع جميع ملحقاته. لبدء الإرجاع تواصل مع خدمة العملاء واذكر رقم الطلب.
                {supportEmail && (
                  <>
                    {" "}
                    راسلنا على{" "}
                    <a
                      href={`mailto:${supportEmail}`}
                      className="font-semibold text-ink-700 underline"
                      dir="ltr"
                    >
                      {supportEmail}
                    </a>
                    .
                  </>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section id="account" className="card scroll-mt-4 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-ink-950">الحساب والطلبات</h2>
          <dl className="mt-4 space-y-4 leading-relaxed">
            <div>
              <dt className="font-semibold text-ink-950">هل أحتاج إلى حساب للشراء؟</dt>
              <dd className="mt-1 text-body">
                يمكنك التصفح وإضافة المنتجات إلى السلة بدون حساب. عند إتمام الطلب نطلب منك تسجيل
                الدخول أو{" "}
                <Link href="/register" className="font-semibold text-ink-700 underline">
                  إنشاء حساب
                </Link>{" "}
                لتتمكن من متابعة طلبك، وتنتقل سلتك معك تلقائياً.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">ما الحد الأقصى للكمية؟</dt>
              <dd className="mt-1 text-body">
                حتى 10 قطع من المنتج الواحد في الطلب، بحسب المتوفر في المخزون.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-950">كيف أقيّم منتجاً؟</dt>
              <dd className="mt-1 text-body">
                من صفحة المنتج، في قسم «تقييمات العملاء». تظهر شارة «مشترٍ موثّق» بجانب تقييمات من
                اشتروا المنتج فعلاً.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
