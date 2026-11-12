"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

export default function PaymentStatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  async function change(paymentStatus: string) {
    setBusy(true);
    const result = await api(`/api/admin/orders/${orderId}`, "PATCH", { paymentStatus });
    setBusy(false);
    if (!result.ok) { toast({ tone: "error", message: result.error }); return; }
    toast({ message: "حُدّثت حالة الدفع." }); router.refresh();
  }
  return <select aria-label="حالة الدفع" value={status} disabled={busy} onChange={(e) => change(e.target.value)} className="field w-40 py-1.5 text-sm"><option value="pending">بانتظار التحقق</option><option value="paid">تم التحقق</option></select>;
}
