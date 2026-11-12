"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/categories", label: "الأقسام" },
  { href: "/admin/orders", label: "الطلبات" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام لوحة التحكم">
      <ul className="inline-flex gap-1 rounded-full border border-line bg-white p-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-4 py-2 text-sm font-semibold ${
                  active ? "bg-ink-900 text-white" : "text-body hover:bg-paper"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
