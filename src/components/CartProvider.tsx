"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  id: number;
  productId: number;
  slug: string;
  title: string;
  brand: string | null;
  image: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promoValid: boolean;
  promoLabel: string | null;
}

interface CartResponse {
  items: CartLine[];
  count: number;
  subtotal: number;
  totals: CartTotals;
}

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

interface CartContextValue {
  ready: boolean;
  items: CartLine[];
  count: number;
  totals: CartTotals;
  promo: string;
  wishlist: number[];
  toasts: Toast[];
  add: (productId: number, quantity?: number) => Promise<void>;
  setQuantity: (productId: number, quantity: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
  applyPromo: (code: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
  notify: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

const EMPTY_TOTALS: CartTotals = {
  subtotal: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  promoValid: false,
  promoLabel: null,
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<CartTotals>(EMPTY_TOTALS);
  const [promo, setPromo] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const applyResponse = useCallback((data: CartResponse) => {
    setItems(data.items ?? []);
    setTotals(data.totals ?? EMPTY_TOTALS);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/cart${promo ? `?promo=${encodeURIComponent(promo)}` : ""}`, {
        cache: "no-store",
      });
      if (res.ok) applyResponse(await res.json());
    } catch {
      /* offline is fine */
    } finally {
      setReady(true);
    }
  }, [applyResponse, promo]);

  const loadWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setWishlist((data.items ?? []).map((item: { id: number }) => item.id));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    void loadWishlist();
  }, [refresh, loadWishlist]);

  const add = useCallback(
    async (productId: number, quantity = 1) => {
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error ?? "تعذّرت الإضافة إلى السلة", "error");
          return;
        }
        applyResponse(data);
        notify("تمت إضافة المنتج إلى السلة", "success");
      } catch {
        notify("تحقق من اتصالك بالإنترنت", "error");
      }
    },
    [applyResponse, notify],
  );

  const setQuantity = useCallback(
    async (productId: number, quantity: number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item,
        ),
      );
      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        if (res.ok) applyResponse(await res.json());
      } catch {
        notify("تعذّر تحديث الكمية", "error");
      }
    },
    [applyResponse, notify],
  );

  const remove = useCallback(
    async (productId: number) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      try {
        const res = await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
        if (res.ok) applyResponse(await res.json());
      } catch {
        notify("تعذّر حذف المنتج", "error");
      }
    },
    [applyResponse, notify],
  );

  const clear = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { method: "DELETE" });
      if (res.ok) applyResponse(await res.json());
    } catch {
      notify("تعذّر تفريغ السلة", "error");
    }
  }, [applyResponse, notify]);

  const applyPromo = useCallback(
    async (code: string) => {
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoCode: code }),
        });
        if (!res.ok) return false;
        const data: CartResponse = await res.json();
        applyResponse(data);
        const valid = Boolean(data.totals?.promoValid);
        setPromo(valid ? code.trim().toUpperCase() : "");
        notify(
          valid ? (data.totals.promoLabel ?? "تم تفعيل الكود") : "كود الخصم غير صالح",
          valid ? "success" : "error",
        );
        return valid;
      } catch {
        notify("تعذّر تطبيق الكود", "error");
        return false;
      }
    },
    [applyResponse, notify],
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      const already = wishlist.includes(productId);
      setWishlist((prev) =>
        already ? prev.filter((id) => id !== productId) : [...prev, productId],
      );
      try {
        const res = await fetch("/api/wishlist", {
          method: already ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("failed");
        notify(already ? "تمت الإزالة من المفضلة" : "تمت الإضافة إلى المفضلة", "info");
      } catch {
        setWishlist((prev) =>
          already ? [...prev, productId] : prev.filter((id) => id !== productId),
        );
        notify("تعذّر تحديث المفضلة", "error");
      }
    },
    [notify, wishlist],
  );

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      items,
      count,
      totals,
      promo,
      wishlist,
      toasts,
      add,
      setQuantity,
      remove,
      clear,
      applyPromo,
      refresh,
      toggleWishlist,
      notify,
      dismissToast,
    }),
    [
      ready,
      items,
      count,
      totals,
      promo,
      wishlist,
      toasts,
      add,
      setQuantity,
      remove,
      clear,
      applyPromo,
      refresh,
      toggleWishlist,
      notify,
      dismissToast,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
