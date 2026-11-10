import type { Metadata } from "next";
import AuthPanel from "@/components/AuthPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي | سوق" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const mode = sp.mode === "register" ? "register" : "login";
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-ink-900">
          {user ? `مرحبًا، ${user.name}` : "حسابي"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user
            ? "أدر بياناتك وطلباتك ومفضلتك من مكان واحد."
            : "سجّل الدخول أو أنشئ حسابًا جديدًا للاستمتاع بتجربة تسوق أسرع."}
        </p>
      </div>
      <AuthPanel
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                address: user.address,
              }
            : null
        }
        initialMode={mode}
      />
    </div>
  );
}
