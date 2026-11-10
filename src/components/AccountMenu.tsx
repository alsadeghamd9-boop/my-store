"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import {
  BoxIcon,
  ChevronDown,
  DashboardIcon,
  HeartIcon,
  LogoutIcon,
  UserIcon,
} from "@/components/icons";

interface Props {
  user: { name: string; email: string; role: string } | null;
}

export default function AccountMenu({ user }: Props) {
  const router = useRouter();
  const { refresh } = useCart();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refresh();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs leading-tight transition hover:outline hover:outline-1 hover:outline-white/40"
        aria-expanded={open}
      >
        <UserIcon width={20} height={20} className="text-gold-400" />
        <span className="hidden text-right sm:block">
          <span className="block text-white/70">
            {user ? `مرحبًا، ${firstName}` : "مرحبًا بك"}
          </span>
          <span className="flex items-center gap-0.5 font-bold">
            {user ? "حسابك" : "سجّل الدخول"}
            <ChevronDown width={12} height={12} />
          </span>
        </span>
      </button>

      {open && (
        <div className="card absolute left-0 top-11 z-50 w-60 p-2 text-ink-900 animate-fade-up">
          {!user ? (
            <>
              <a
                href="/account"
                className="btn-gold block rounded-lg px-3 py-2 text-center text-sm font-bold"
              >
                تسجيل الدخول
              </a>
              <p className="px-2 py-2 text-xs text-slate-500">
                عميل جديد؟{" "}
                <a href="/account?mode=register" className="font-bold text-gold-600 hover:underline">
                  أنشئ حسابك
                </a>
              </p>
              <div className="my-1 border-t border-slate-100" />
              <MenuLink href="/orders" icon={<BoxIcon width={16} height={16} />} label="طلباتي" />
              <MenuLink href="/wishlist" icon={<HeartIcon width={16} height={16} />} label="المفضلة" />
            </>
          ) : (
            <>
              <div className="px-2 pb-2">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-slate-500" dir="ltr">
                  {user.email}
                </p>
              </div>
              <div className="my-1 border-t border-slate-100" />
              <MenuLink href="/orders" icon={<BoxIcon width={16} height={16} />} label="طلباتي" />
              <MenuLink href="/wishlist" icon={<HeartIcon width={16} height={16} />} label="المفضلة" />
              <MenuLink href="/account" icon={<UserIcon width={16} height={16} />} label="بياناتي" />
              {user.role === "admin" && (
                <MenuLink
                  href="/admin"
                  icon={<DashboardIcon width={16} height={16} />}
                  label="لوحة التحكم"
                />
              )}
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <LogoutIcon width={16} height={16} />
                {busy ? "جارٍ الخروج..." : "تسجيل الخروج"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <span className="text-slate-500">{icon}</span>
      {label}
    </a>
  );
}
