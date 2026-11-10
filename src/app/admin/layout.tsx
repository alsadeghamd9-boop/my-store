import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <ShieldIcon width={26} height={26} />
          </span>
          <h1 className="text-xl font-black text-ink-900">هذه المنطقة للمسؤولين فقط</h1>
          <p className="text-sm text-slate-500">
            سجّل الدخول بحساب مسؤول للوصول إلى لوحة التحكم وإدارة المنتجات والطلبات.
          </p>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600" dir="ltr">
            admin@souq.sa / admin1234
          </p>
          <Link href="/account" className="btn-gold rounded-full px-6 py-2.5 text-sm font-extrabold">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-ink-900">لوحة تحكم المتجر</h1>
        <p className="mt-1 text-sm text-slate-500">
          مرحبًا {admin.name} — أدر منتجاتك وطلباتك وعملاءك من هنا.
        </p>
      </div>
      <AdminNav />
      <div className="mt-4">{children}</div>
    </div>
  );
}
