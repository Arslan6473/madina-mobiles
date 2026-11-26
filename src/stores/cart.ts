"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

/**
 * Client cart persisted to localStorage (works for guests and signed-in users).
 * Prices here are for display only — the server re-prices everything at checkout.
 */
export type CartItem = {
  key: string;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  slug: string;
  image?: string;
  unitPrice: number;
  regularPrice?: number;
  /** Last known available stock — used to cap quantity in the UI. */
  maxStock: number;
  quantity: number;
};

export const cartKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? ""}`;

type AddInput = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** Returns the quantity actually in the cart for this line after adding. */
  addItem: (item: AddInput) => { added: number; capped: boolean };
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  /** Syncs prices/stock from a server quote. */
  syncFromQuote: (
    lines: { productId: string; variantId?: string; unitPrice: number; regularPrice: number; availableStock: number; name: string; image?: string }[],
  ) => void;
};

const clampQty = (q: number, max: number) => Math.max(1, Math.min(Math.floor(q) || 1, max, MAX_QTY_PER_LINE));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (input) => {
        const key = cartKey(input.productId, input.variantId);
        const qty = input.quantity ?? 1;
        const existing = get().items.find((i) => i.key === key);
        const max = Math.max(0, input.maxStock);
        if (max <= 0) return { added: 0, capped: true };
        const desired = (existing?.quantity ?? 0) + qty;
        const finalQty = clampQty(desired, max);
        set((s) => ({
          items: existing
            ? s.items.map((i) => (i.key === key ? { ...i, ...input, key, quantity: finalQty } : i))
            : [...s.items, { ...input, key, quantity: finalQty }],
        }));
        return { added: finalQty - (existing?.quantity ?? 0), capped: finalQty < desired };
      },
      updateQuantity: (key, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i)),
        })),
      removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      setOpen: (isOpen) => set({ isOpen }),
      syncFromQuote: (lines) =>
        set((s) => ({
          items: s.items.map((item) => {
            const line = lines.find((l) => l.productId === item.productId && (l.variantId ?? "") === (item.variantId ?? ""));
            if (!line) return item;
            return {
              ...item,
              name: line.name || item.name,
              image: line.image ?? item.image,
              unitPrice: line.unitPrice,
              regularPrice: line.regularPrice,
              maxStock: line.availableStock,
              quantity: line.availableStock > 0 ? Math.min(item.quantity, line.availableStock) : item.quantity,
            };
          }),
        })),
    }),
    {
      name: "mmg-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (s: CartState) => s.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

/**
 * True once the persisted cart has been read from localStorage. Render cart-dependent
 * UI (counts, totals) only after this to avoid server/client hydration mismatches.
 */
export function useCartHydrated() {
  return useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
