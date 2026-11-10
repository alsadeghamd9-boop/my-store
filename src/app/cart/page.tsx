import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "سلة التسوق | سوق" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-6">
      <CartView />
    </div>
  );
}
