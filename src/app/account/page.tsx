export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import {
  ChevronLeft,
  Heart,
  Info,
  LayoutDashboard,
  Package,
  ShoppingCart,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/Badges";
import LogoutButton from "@/components/LogoutButton";
import PasswordForm from "@/components/PasswordForm";
import { Money } from "@/components/Price";
import { getDb } from "@/db";
import { orders, users, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { formatDate, itemsLabel } from "@/lib/format";

export const metadata: Metadata = { title: "حسابي" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const [[profile], [{ n: orderCount }], [{ n: wishCount }], [latest], cart] = await Promise.all([
    getDb().select({ createdAt: users.createdAt }).from(users).where(eq(users.id, user.id)).limit(1),
    getDb().select({ n: count() }).from(orders).where(eq(orders.userId, user.id)),
    getDb().select({ n: count() }).from(wishlistItems).where(eq(wishlistItems.userId, user.id)),
    getDb().select({
        id: orders.id,
        number: orders.number,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(1),
    getCart(),
  ]);

  const tiles = [
    {
      href: "/orders",
      icon: Package,
      title: "طلباتي",
      text: orderCount === 0 ? "لا طلبات بعد" : `${orderCount} طلب`,
    },
    {
      href: "/wishlist",
      icon: Heart,
      title: "المفضلة",
      text: wishCount === 0 ? "لا منتجات محفوظة" : itemsLabel(wishCount),
    },
    {
      href: "/cart",
      icon: ShoppingCart,
      title: "سلة التسوق",
      text: cart.count === 0 ? "فارغة" : itemsLabel(cart.count),
    },
    { href: "/help", icon: Info, title: "المساعدة", text: "الشحن، الدفع والإرجاع" },
  ];
  if (user.role === "admin") {
    tiles.unshift({
      href: "/admin",
      icon: LayoutDashboard,
      title: "لوحة التحكم",
      text: "إدارة المنتجات والطلبات",
    });
  }

  return (
    <div className="container-page py-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink-900 font-display text-xl font-bold text-white">
          {user.name.trim().charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-ink-950">مرحباً، {user.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            <span dir="ltr">{user.email}</span>
            {profile ? ` · عضو منذ ${formatDate(profile.createdAt)}` : ""}
          </p>
        </div>
        <LogoutButton />
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link
              href={href}
              className="card flex h-full items-center gap-3 p-4 transition-colors hover:border-ink-700"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-saffron-100 text-ink-900">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink-950">{title}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
              <ChevronLeft size={18} aria-hidden="true" className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      {latest && (
        <section className="card mt-5 p-5" aria-labelledby="latest-order">
          <h2 id="latest-order" className="text-lg font-bold text-ink-950">
            آخر طلب
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="text-muted">رقم الطلب </span>
              <span className="font-semibold text-ink-950" dir="ltr">
                {latest.number}
              </span>
            </p>
            <p className="text-body">{formatDate(latest.createdAt)}</p>
            <Money value={latest.total} className="font-semibold text-ink-950" />
            <OrderStatusBadge status={latest.status} />
            <Link href={`/orders/${latest.id}`} className="btn btn-outline ms-auto">
              تتبّع الطلب
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <section className="card mt-5 p-5 sm:p-6" aria-labelledby="security-title">
        <h2 id="security-title" className="text-lg font-bold text-ink-950">
          كلمة المرور
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          {user.role === "admin"
            ? "حسابك يدير المتجر كله — استخدم كلمة مرور قوية لا تستعملها في مكان آخر."
            : "غيّر كلمة المرور متى شئت؛ سيُسجَّل خروجك من الأجهزة الأخرى."}
        </p>
        {user.role === "admin" ? <p className="text-sm text-muted">لتغيير كلمة مرور المدير، حدّث متغير ADMIN_PASSWORD في إعدادات الاستضافة ثم أعد النشر.</p> : <div className="max-w-2xl"><PasswordForm /></div>}
      </section>
    </div>
  );
}
