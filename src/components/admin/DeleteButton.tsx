"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useToast } from "@/components/ToastProvider";

export default function DeleteButton({ url, label, confirmation, redirectTo }: { url: string; label: string; confirmation: string; redirectTo?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (busy || !window.confirm(confirmation)) return;
    setBusy(true);
    const result = await api(url, "DELETE");
    setBusy(false);
    if (!result.ok) { toast({ tone: "error", message: result.error }); return; }
    toast({ message: "تم الحذف بنجاح." });
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }
  return <button type="button" disabled={busy} onClick={remove} className="rounded px-1 text-sm font-semibold text-deal hover:underline disabled:opacity-50">{busy ? "جارٍ الحذف..." : label}</button>;
}
