"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, DashboardIcon, TruckIcon } from "@/components/icons";

const tabs = [
  { href: "/admin", label: "نظرة عامة", icon: DashboardIcon, exact: true },
  { href: "/admin/products", label: "المنتجات", icon: BoxIcon },
  { href: "/admin/orders", label: "الطلبات", icon: TruckIcon },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto rounded-xl bg-white p-1.5 ring-1 ring-slate-200">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition ${
              active ? "bg-ink-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <tab.icon width={17} height={17} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
