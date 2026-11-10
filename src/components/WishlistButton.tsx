"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

type Props = {
  productId: number;
  initialSaved: boolean;
  variant?: "icon" | "full";
};

export default function WishlistButton({ productId, initialSaved, variant = "icon" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(initialSaved), [initialSaved]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await api<{ saved: boolean }>("/api/wishlist", "POST", { productId });
    setBusy(false);
    if (!res.ok) {
      if (res.status === 401) {
        toast({ tone: "error", message: res.error });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      toast({ tone: "error", message: res.error });
      return;
    }
    setSaved(res.data.saved);
    toast(
      res.data.saved
        ? { message: "حُفظ المنتج في المفضلة.", href: "/wishlist", hrefLabel: "عرض المفضلة" }
        : { message: "أُزيل المنتج من المفضلة." },
    );
    router.refresh();
  }

  const label = saved ? "إزالة من المفضلة" : "حفظ في المفضلة";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        disabled={busy}
        className="btn btn-outline w-full"
      >
        <Heart
          size={17}
          aria-hidden="true"
          className={saved ? "text-deal" : ""}
          fill={saved ? "currentColor" : "none"}
        />
        {saved ? "محفوظ في المفضلة" : "أضف إلى المفضلة"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      disabled={busy}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-line transition-colors hover:text-deal ${
        saved ? "text-deal" : "text-ink-800"
      }`}
    >
      <Heart size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
