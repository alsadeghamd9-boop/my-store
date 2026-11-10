import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-12">
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
        <p className="font-display text-6xl font-extrabold text-saffron-500" dir="ltr">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-ink-950">هذه الصفحة غير موجودة</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          ربما تغيّر الرابط أو لم يعد المنتج معروضاً. جرّب البحث من الشريط العلوي أو عد إلى الصفحة
          الرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">
            الصفحة الرئيسية
          </Link>
          <Link href="/search" className="btn btn-outline">
            كل المنتجات
          </Link>
        </div>
      </div>
    </div>
  );
}
