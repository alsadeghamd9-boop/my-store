export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "تسجيل الدخول" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "/");
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="card mx-auto max-w-md p-5 sm:p-8">
        <h1 className="text-2xl font-bold text-ink-950">تسجيل الدخول</h1>
        <p className="mt-1.5 text-sm text-muted">
          {next === "/checkout"
            ? "سجّل الدخول لإتمام طلبك. سلتك محفوظة كما هي."
            : "أهلاً بعودتك. تابع طلباتك ومفضلتك من حسابك."}
        </p>
        <div className="mt-6">
          <AuthForm mode="login" next={next} />
        </div>
        <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
          جديد في سوق السودان؟{" "}
          <Link
            href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="rounded font-semibold text-ink-700 underline hover:text-ink-950"
          >
            أنشئ حساباً
          </Link>
        </p>
      </div>
    </div>
  );
}
