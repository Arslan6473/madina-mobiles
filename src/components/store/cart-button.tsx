"use client";

import { ShoppingBag } from "lucide-react";
import { selectCartCount, useCart, useCartHydrated } from "@/stores/cart";

export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart(selectCartCount);
  const setOpen = useCart((s) => s.setOpen);
  const shown = hydrated ? count : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative flex size-11 items-center justify-center rounded-full text-navy transition hover:bg-muted"
      aria-label={`Open cart${shown ? `, ${shown} items` : ""}`}
    >
      <ShoppingBag className="size-6" />
      {shown > 0 && (
        <span className="absolute top-0.5 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-orange-brand px-1 text-[11px] leading-5 font-bold text-white">
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </button>
  );
}
