"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

export default function LogoutButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    const res = await api("/api/auth/logout", "POST");
    if (!res.ok) {
      setBusy(false);
      toast({ tone: "error", message: res.error });
      return;
    }
    window.location.assign("/");
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className="btn btn-outline">
      <LogOut size={16} aria-hidden="true" />
      {busy ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
    </button>
  );
}
