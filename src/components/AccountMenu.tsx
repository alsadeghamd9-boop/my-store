"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { api } from "@/lib/client";

const item =
  "flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm text-body hover:bg-paper";

export default function AccountMenu({ user }: { user: { name: string; role: string } | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-paper"
      >
        <User size={20} aria-hidden="true" />
        <span className="hidden sm:inline">دخول</span>
      </Link>
    );
  }

  async function logout() {
    setBusy(true);
    const res = await api("/api/auth/logout", "POST");
    if (!res.ok) {
      setBusy(false);
      router.refresh();
      return;
    }
    // Full reload so every cached view forgets the signed-in shopper.
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-paper"
      >
        <User size={20} aria-hidden="true" />
        <span className="max-w-28 truncate">مرحباً، {firstName}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="on-light absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white py-1.5 text-body shadow-[0_20px_50px_-12px_rgba(6,25,28,0.35)]">
          <p className="truncate border-b border-line px-4 pt-1.5 pb-2.5 text-sm font-semibold text-ink-950">
            {user.name}
          </p>
          <Link href="/account" onClick={() => setOpen(false)} className={item}>
            <User size={17} aria-hidden="true" className="text-muted" />
            حسابي
          </Link>
          <Link href="/orders" onClick={() => setOpen(false)} className={item}>
            <Package size={17} aria-hidden="true" className="text-muted" />
            طلباتي
          </Link>
          <Link href="/wishlist" onClick={() => setOpen(false)} className={item}>
            <Heart size={17} aria-hidden="true" className="text-muted" />
            المفضلة
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" onClick={() => setOpen(false)} className={item}>
              <LayoutDashboard size={17} aria-hidden="true" className="text-muted" />
              لوحة التحكم
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className={`${item} border-t border-line disabled:opacity-60`}
          >
            <LogOut size={17} aria-hidden="true" className="text-muted" />
            {busy ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
          </button>
        </div>
      )}
    </div>
  );
}
