"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { useMoney, useStoreConfig } from "@/components/providers/store-provider";
import { selectCartSubtotal, useCart, useCartHydrated } from "@/stores/cart";
import { calculateShipping } from "@/lib/pricing";
import { cartMessage, whatsappLink } from "@/lib/whatsapp";
import { quoteCartAction } from "@/actions/checkout";

/** Re-prices the persisted cart against the server (prices/stock may have changed). */
export function useCartSync(enabled: boolean) {
  const items = useCart((s) => s.items);
  const syncFromQuote = useCart((s) => s.syncFromQuote);
  const signature = items.map((i) => `${i.key}x${i.quantity}`).join("|");
  useEffect(() => {
    if (!enabled || !items.length) return;
    let cancelled = false;
    quoteCartAction(items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))).then((res) => {
      if (!cancelled && res.ok) syncFromQuote(res.data.lines);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-quote only when lines change
  }, [enabled, signature]);
}

export function CartSheet() {
  const hydrated = useCartHydrated();
  const { items, isOpen, setOpen, updateQuantity, removeItem } = useCart();
  const subtotal = useCart(selectCartSubtotal);
  const store = useStoreConfig();
  const money = useMoney();
  useCartSync(hydrated && isOpen);

  const shipping = calculateShipping(subtotal, store);
  const remaining = store.freeDeliveryThreshold > 0 ? Math.max(0, store.freeDeliveryThreshold - subtotal) : 0;
  const waText = cartMessage(
    items.map((i) => ({ name: i.name, variantLabel: i.variantLabel, quantity: i.quantity, unitPrice: i.unitPrice })),
    subtotal,
    store,
  );

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="size-5 text-royal" /> Your Cart
          </SheetTitle>
        </SheetHeader>

        {!hydrated || items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Browse our latest gadgets and accessories.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className={buttonVariants({ className: "mt-2 h-10 px-5" })}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {store.freeDeliveryThreshold > 0 && (
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5 text-xs">
                <Truck className="size-4 shrink-0 text-royal" />
                {remaining > 0 ? (
                  <span>
                    Add <strong>{money(remaining)}</strong> more for <strong>free delivery</strong>.
                  </span>
                ) : (
                  <span className="font-medium text-emerald-700">You&apos;ve unlocked free delivery!</span>
                )}
              </div>
            )}
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-sm font-medium hover:text-royal"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel && <span className="text-xs text-muted-foreground">{item.variantLabel}</span>}
                    {item.maxStock <= 0 && <span className="text-xs font-medium text-destructive">Out of stock — please remove</span>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper
                        value={item.quantity}
                        max={item.maxStock}
                        onChange={(q) => updateQuantity(item.key, q)}
                        label={item.name}
                      />
                      <div className="text-right">
                        <div className="text-sm font-bold text-navy">{money(item.unitPrice * item.quantity)}</div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <SheetFooter className="gap-3 border-t bg-muted/30 p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-semibold">{shipping === 0 ? "Free" : money(shipping)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-navy">{money(subtotal + shipping)}</span>
                </div>
              </div>
              <Link href="/checkout" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "h-11 w-full text-base" })}>
                Checkout · Cash on Delivery
              </Link>
              <a
                href={whatsappLink(store.whatsapp, waText)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg", className: "h-11 w-full bg-whatsapp text-base text-white hover:bg-whatsapp/90" })}
              >
                <WhatsAppIcon /> Order via WhatsApp
              </a>
              <Link href="/cart" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", className: "h-10 w-full" })}>
                View cart
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function QtyStepper({
  value,
  max,
  onChange,
  label,
  size = "sm",
}: {
  value: number;
  max: number;
  onChange: (q: number) => void;
  label: string;
  size?: "sm" | "lg";
}) {
  const btn = size === "lg" ? "size-11" : "size-8";
  return (
    <div className="inline-flex items-center rounded-full border bg-background">
      <button
        type="button"
        className={`${btn} flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-40`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Decrease quantity of ${label}`}
      >
        <Minus className="size-3.5" />
      </button>
      <span className={`${size === "lg" ? "w-10 text-base" : "w-7 text-sm"} text-center font-semibold tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={`${btn} flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-40`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase quantity of ${label}`}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
