"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WhatsAppIcon } from "@/components/shared/icons";
import { QtyStepper, useCartSync } from "@/components/store/cart-sheet";
import { useMoney, useStoreConfig } from "@/components/providers/store-provider";
import { selectCartSubtotal, useCart, useCartHydrated } from "@/stores/cart";
import { calculateShipping } from "@/lib/pricing";
import { cartMessage, whatsappLink } from "@/lib/whatsapp";

export function CartView() {
  const hydrated = useCartHydrated();
  const { items, updateQuantity, removeItem, clear } = useCart();
  const subtotal = useCart(selectCartSubtotal);
  const store = useStoreConfig();
  const money = useMoney();
  useCartSync(hydrated);

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-10 text-muted-foreground" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-6 h-11 px-6" })}>
          Start shopping
        </Link>
      </div>
    );
  }

  const shipping = calculateShipping(subtotal, store);
  const remaining = store.freeDeliveryThreshold > 0 ? Math.max(0, store.freeDeliveryThreshold - subtotal) : 0;
  const unavailable = items.some((i) => i.maxStock <= 0);
  const waText = cartMessage(
    items.map((i) => ({ name: i.name, variantLabel: i.variantLabel, quantity: i.quantity, unitPrice: i.unitPrice })),
    subtotal,
    store,
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border bg-card lg:col-span-2">
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/product/${item.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/product/${item.slug}`} className="line-clamp-2 font-medium hover:text-royal">
                    {item.name}
                  </Link>
                  {item.variantLabel && <p className="text-sm text-muted-foreground">{item.variantLabel}</p>}
                  <p className="text-sm text-muted-foreground">{money(item.unitPrice)} each</p>
                  {item.maxStock <= 0 ? (
                    <p className="text-xs font-medium text-destructive">Out of stock — please remove this item</p>
                  ) : item.quantity >= item.maxStock ? (
                    <p className="text-xs text-orange-brand">Maximum available quantity</p>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end">
                  <QtyStepper value={item.quantity} max={item.maxStock} onChange={(q) => updateQuantity(item.key, q)} label={item.name} />
                  <div className="text-right">
                    <div className="font-bold text-navy">{money(item.unitPrice * item.quantity)}</div>
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
        <div className="flex items-center justify-between border-t p-4">
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-royal hover:underline">
            <ArrowLeft className="size-4" /> Continue shopping
          </Link>
          <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
            Clear cart
          </Button>
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-semibold text-navy">Order Summary</h2>
        {store.freeDeliveryThreshold > 0 && (
          <div className="space-y-2 rounded-xl bg-muted/60 p-3 text-xs">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-royal" />
              {remaining > 0 ? (
                <span>
                  Add <strong>{money(remaining)}</strong> more for free delivery
                </span>
              ) : (
                <span className="font-medium text-emerald-700">Free delivery unlocked!</span>
              )}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-royal transition-all"
                style={{ width: `${Math.min(100, (subtotal / store.freeDeliveryThreshold) * 100)}%` }}
              />
            </div>
          </div>
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</dt>
            <dd className="font-semibold">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-semibold">{shipping === 0 ? "Free" : money(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold text-navy">{money(subtotal + shipping)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">Payment: Cash on Delivery. Final prices are confirmed at checkout.</p>
        {unavailable ? (
          <Button size="lg" disabled className="h-11 w-full">
            Remove unavailable items to continue
          </Button>
        ) : (
          <Link href="/checkout" className={buttonVariants({ size: "lg", className: "h-11 w-full text-base" })}>
            Proceed to Checkout
          </Link>
        )}
        <a
          href={whatsappLink(store.whatsapp, waText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", className: "h-10 w-full border-whatsapp text-whatsapp hover:bg-whatsapp hover:text-white" })}
        >
          <WhatsAppIcon /> Order via WhatsApp instead
        </a>
      </aside>
    </div>
  );
}
