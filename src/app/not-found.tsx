import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl font-black text-gold-400">404</span>
      <h1 className="text-2xl font-black text-ink-900">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500">
        الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. جرّب البحث عن المنتج الذي تريده.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-gold rounded-full px-6 py-2.5 text-sm font-extrabold">
          العودة للرئيسية
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-ink-800 transition hover:bg-slate-50"
        >
          تصفح كل المنتجات
        </Link>
      </div>
    </div>
  );
}
