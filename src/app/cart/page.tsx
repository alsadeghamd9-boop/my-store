import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Truck } from "lucide-react";
import CartLineItem from "@/components/CartLineItem";
import { Money } from "@/components/Price";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { itemsLabel } from "@/lib/format";

export const metadata: Metadata = { title: "سلة التسوق" };

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-10">
        <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-saffron-100 text-ink-900">
            <ShoppingCart size={30} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-ink-950">سلتك فارغة</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            أضف المنتجات التي تعجبك وستجدها هنا جاهزة لإتمام الطلب.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/search?deal=1" className="btn btn-primary">
              تصفّح عروض اليوم
            </Link>
            <Link href="/search" className="btn btn-outline">
              كل المنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;
  const progress = Math.min(100, Math.round((cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="container-page py-5">
      <h1 className="text-2xl font-bold text-ink-950">سلة التسوق</h1>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {cart.subtotal > 0 && (
            <div className="card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-express/10 text-express">
                <Truck size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-body">
                  {remaining > 0 ? (
                    <>
                      أضف منتجات بقيمة <Money value={remaining} className="font-bold" /> لتحصل على
                      توصيل مجاني.
                    </>
                  ) : (
                    "طلبك مؤهل للتوصيل المجاني."
                  )}
                </p>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-paper"
                  role="progressbar"
                  aria-label="التقدّم نحو التوصيل المجاني"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div className="h-full rounded-full bg-express" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          <ul className="card divide-y divide-line">
            {cart.lines.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </ul>
        </div>

        <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-4 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-bold text-ink-950">ملخص الطلب</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">المجموع الفرعي ({itemsLabel(cart.count)})</dt>
                <dd>
                  <Money value={cart.subtotal} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">التوصيل</dt>
                <dd>
                  {cart.subtotal === 0 ? (
                    "—"
                  ) : cart.shipping === 0 ? (
                    <span className="font-semibold text-express">مجاني</span>
                  ) : (
                    <Money value={cart.shipping} />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-base">
                <dt className="font-bold text-ink-950">الإجمالي</dt>
                <dd>
                  <Money value={cart.total} className="font-display font-bold text-ink-950" />
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">الأسعار شاملة ضريبة القيمة المضافة.</p>

            {cart.hasIssues ? (
              <>
                <button type="button" disabled className="btn btn-primary mt-5 w-full py-3 text-base">
                  إتمام الطلب
                </button>
                <p className="mt-2 text-sm leading-relaxed text-deal" role="status">
                  بعض المنتجات في سلتك تحتاج إلى تعديل قبل المتابعة — راجع الملاحظات بجانبها.
                </p>
              </>
            ) : (
              <>
                <Link href="/checkout" className="btn btn-primary mt-5 w-full py-3 text-base">
                  إتمام الطلب
                </Link>
                {!user && (
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    سنطلب منك تسجيل الدخول أو إنشاء حساب، وستبقى سلتك كما هي.
                  </p>
                )}
              </>
            )}
            <Link
              href="/search"
              className="mt-3 block rounded-md text-center text-sm font-semibold text-ink-700 hover:underline"
            >
              متابعة التسوق
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
