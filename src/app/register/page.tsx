import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "إنشاء حساب" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "/");
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="card mx-auto max-w-md p-5 sm:p-8">
        <h1 className="text-2xl font-bold text-ink-950">إنشاء حساب</h1>
        <p className="mt-1.5 text-sm text-muted">
          حساب واحد لتتبّع طلباتك وحفظ مفضلتك وإتمام الشراء أسرع.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" next={next} />
        </div>
        <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          لديك حساب؟{" "}
          <Link
            href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="rounded font-semibold text-ink-700 underline hover:text-ink-950"
          >
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
