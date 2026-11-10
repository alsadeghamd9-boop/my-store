"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/constants";

export default function OrderStatusSelect({
  orderId,
  number,
  status,
}: {
  orderId: number;
  number: string;
  status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  useEffect(() => setValue(status), [status]);

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setBusy(true);
    const res = await api(`/api/admin/orders/${orderId}`, "PATCH", { status: next });
    setBusy(false);
    if (!res.ok) {
      setValue(previous);
      toast({ tone: "error", message: res.error });
      return;
    }
    toast({ message: `حُدّثت حالة الطلب ${number}.` });
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value)}
      disabled={busy || status === "cancelled"}
      aria-label={`حالة الطلب ${number}`}
      className="field w-36 py-1.5 text-sm"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
