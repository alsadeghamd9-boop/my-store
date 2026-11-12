import { Zap } from "lucide-react";
import { STATUS_LABELS, isOrderStatus } from "@/lib/constants";

export function ExpressBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-express/10 px-1.5 py-0.5 text-xs font-semibold text-express ${className}`}
    >
      <Zap size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      مميز
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-saffron-100 text-[#6b4700]",
  processing: "bg-ink-100 text-ink-900",
  shipped: "bg-ink-800 text-white",
  delivered: "bg-express/10 text-express",
  cancelled: "bg-deal/10 text-deal",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        STATUS_STYLES[status] ?? "bg-paper text-body"
      }`}
    >
      {isOrderStatus(status) ? STATUS_LABELS[status] : status}
    </span>
  );
}
