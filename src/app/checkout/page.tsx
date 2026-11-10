import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import { ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الطلب | سوق" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-gold-600">
              الرئيسية
            </Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-gold-600">
              السلة
            </Link>
            <span>/</span>
            <span className="font-bold text-ink-800">إتمام الطلب</span>
          </nav>
          <h1 className="text-2xl font-black text-ink-900">إتمام الطلب</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <ShieldIcon width={15} height={15} />
          اتصال آمن ومشفّر
        </span>
      </div>
      <CheckoutForm />
    </div>
  );
}
