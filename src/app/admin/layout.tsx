import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "لوحة التحكم" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();

  return (
    <div className="container-page py-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-950">لوحة التحكم</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
