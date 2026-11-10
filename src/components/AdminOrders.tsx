"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatDateTime, formatPrice, orderStatusLabel, orderStatusTone } from "@/lib/format";

interface AdminOrder {
  id: number;
  reference: string;
  fullName: string;
  phone: string;
  city: string;
  email: string | null;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  itemCount: number;
}

const TABS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد المعالجة" },
  { key: "confirmed", label: "مؤكد" },
  { key: "shipped", label: "مشحون" },
  { key: "delivered", label: "موصّل" },
  { key: "cancelled", label: "ملغي" },
];

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { notify } = useCart();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      } else {
        notify("تعذّر تحميل الطلبات", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(order: AdminOrder, status: string) {
    setSavingId(order.id);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingId(null);
    if (res.ok) {
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, status } : item)));
      notify(`تم تحديث حالة الطلب ${order.reference}`);
    } else {
      notify("تعذّر تحديث الحالة", "error");
    }
  }

  const filtered = tab === "all" ? orders : orders.filter((order) => order.status === tab);
  const revenue = filtered.reduce((sum, order) => sum + (order.status === "cancelled" ? 0 : order.total), 0);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              tab === item.key ? "bg-ink-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
            <span className="mr-1.5 text-[11px] opacity-70">
              {item.key === "all"
                ? orders.length
                : orders.filter((order) => order.status === item.key).length}
            </span>
          </button>
        ))}
        <span className="mr-auto text-sm font-black text-emerald-700">
          إيرادات المعروض: {formatPrice(revenue)}
        </span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="skeleton h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            لا توجد طلبات في هذا التصنيف بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-right font-bold">الطلب</th>
                  <th className="px-3 py-2 text-right font-bold">العميل</th>
                  <th className="px-3 py-2 text-right font-bold">المدينة</th>
                  <th className="px-3 py-2 text-right font-bold">التاريخ</th>
                  <th className="px-3 py-2 text-right font-bold">الدفع</th>
                  <th className="px-3 py-2 text-right font-bold">الإجمالي</th>
                  <th className="px-3 py-2 text-right font-bold">الحالة</th>
                  <th className="px-3 py-2 text-right font-bold">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <span className="block font-black" dir="ltr">
                        {order.reference}
                      </span>
                      <span className="text-[11px] text-slate-400">{order.itemCount} منتج</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="block font-bold">{order.fullName}</span>
                      <span className="block text-[11px] text-slate-500" dir="ltr">
                        {order.phone}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{order.city}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{formatDateTime(order.createdAt)}</td>
                    <td className="px-3 py-2 text-xs">
                      {order.paymentMethod === "card" ? "بطاقة" : "عند الاستلام"}
                    </td>
                    <td className="px-3 py-2 font-black text-rose-600">{formatPrice(order.total)}</td>
                    <td className="px-3 py-2">
                      <select
                        value={order.status}
                        disabled={savingId === order.id}
                        onChange={(event) => void changeStatus(order, event.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-black outline-none disabled:opacity-60 ${orderStatusTone(order.status)}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {orderStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-ink-800 transition hover:bg-slate-100"
                      >
                        التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
