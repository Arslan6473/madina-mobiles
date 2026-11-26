"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AlertTriangle, Banknote, Loader2, Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/account/form-field";
import { useMoney } from "@/components/providers/store-provider";
import { useCart, useCartHydrated } from "@/stores/cart";
import { checkoutDetailsSchema } from "@/lib/validation";
import { PK_PROVINCES } from "@/lib/constants";
import { placeOrderAction, quoteCartAction } from "@/actions/checkout";
import type { CartQuote } from "@/services/cart";

type Input = z.input<typeof checkoutDetailsSchema>;
type Output = z.output<typeof checkoutDetailsSchema>;

const ISSUE_TEXT = {
  unavailable: "No longer available",
  out_of_stock: "Out of stock",
  insufficient_stock: "Quantity reduced to available stock",
  variant_required: "Please choose an option on the product page",
} as const;

export function CheckoutForm({ defaults, signedIn }: { defaults: Partial<Input>; signedIn: boolean }) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const syncFromQuote = useCart((s) => s.syncFromQuote);
  const money = useMoney();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string>();
  const [saveAddress, setSaveAddress] = useState(signedIn);
  const [placing, startPlacing] = useTransition();
  const [placed, setPlaced] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: { fullName: "", email: "", phone: "", whatsapp: "", address: "", city: "", province: "Punjab", postalCode: "", notes: "", ...defaults },
  });

  const lines = items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
  const signature = items.map((i) => `${i.key}x${i.quantity}`).join("|");

  // Authoritative server quote: current prices, stock and delivery charge.
  useEffect(() => {
    if (!hydrated || !lines.length || placed) return;
    let cancelled = false;
    quoteCartAction(lines).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setQuote(res.data);
        setQuoteError(undefined);
        syncFromQuote(res.data.lines);
      } else setQuoteError(res.error);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-quote only when cart lines change
  }, [hydrated, signature]);

  if (!hydrated || (items.length > 0 && !quote && !quoteError) || placed) {
    return (
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-[480px] rounded-2xl lg:col-span-3" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add some products before checking out.</p>
        <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-6 h-11 px-6" })}>
          Browse products
        </Link>
      </div>
    );
  }

  const blocking = quote?.lines.some((l) => l.issue && l.quantity === 0) ?? false;

  const onSubmit = (details: Output) => {
    startPlacing(async () => {
      const res = await placeOrderAction({ details, items: lines, paymentMethod: "cod", saveAddress: signedIn && saveAddress });
      if (!res.ok) {
        for (const [key, messages] of Object.entries(res.fieldErrors ?? {})) {
          if (messages?.[0] && key in checkoutDetailsSchema.shape) setError(key as keyof Input, { message: messages[0] });
        }
        toast.error(res.error);
        // Prices or stock may have changed — refresh the quote.
        const q = await quoteCartAction(lines);
        if (q.ok) {
          setQuote(q.data);
          syncFromQuote(q.data.lines);
        }
        return;
      }
      setPlaced(true);
      clear();
      router.replace(`/order/${res.data.orderNumber}?token=${encodeURIComponent(res.data.accessToken)}&placed=1`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid items-start gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-navy">Delivery details</h2>
          {!signedIn && (
            <p className="mb-4 text-sm text-muted-foreground">
              Checking out as a guest.{" "}
              <Link href="/login?next=/checkout" className="font-medium text-royal hover:underline">
                Sign in
              </Link>{" "}
              to use saved addresses and track orders in your account.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="fullName" label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
              <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
            </FormField>
            <FormField id="phone" label="Mobile number" error={errors.phone?.message} hint="We'll call to confirm your order">
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" aria-invalid={!!errors.phone} {...register("phone")} />
            </FormField>
            <FormField id="whatsapp" label="WhatsApp number" optional error={errors.whatsapp?.message}>
              <Input id="whatsapp" type="tel" inputMode="tel" placeholder="If different from mobile" aria-invalid={!!errors.whatsapp} {...register("whatsapp")} />
            </FormField>
            <FormField id="email" label="Email" optional error={errors.email?.message} hint="For an order confirmation email" className="sm:col-span-2">
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </FormField>
            <FormField id="address" label="Complete address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea
                id="address"
                rows={2}
                autoComplete="street-address"
                placeholder="House #, street, area / mohalla, nearby landmark"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
            </FormField>
            <FormField id="city" label="City" error={errors.city?.message}>
              <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
            </FormField>
            <FormField id="province" label="Province" optional error={errors.province?.message}>
              <select
                id="province"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("province")}
              >
                {PK_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="postalCode" label="Postal code" optional error={errors.postalCode?.message}>
              <Input id="postalCode" inputMode="numeric" autoComplete="postal-code" {...register("postalCode")} />
            </FormField>
            <FormField id="notes" label="Order notes" optional error={errors.notes?.message} className="sm:col-span-2">
              <Textarea id="notes" rows={2} placeholder="Delivery instructions, preferred colour, etc." {...register("notes")} />
            </FormField>
          </div>
          {signedIn && (
            <div className="mt-4 flex items-center gap-2">
              <Checkbox id="saveAddress" checked={saveAddress} onCheckedChange={(v) => setSaveAddress(!!v)} />
              <Label htmlFor="saveAddress" className="font-normal">
                Save this address to my account
              </Label>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-navy">Payment method</h2>
          <div className="flex items-start gap-3 rounded-xl border-2 border-royal bg-royal/5 p-4">
            <Banknote className="mt-0.5 size-6 shrink-0 text-royal" />
            <div>
              <p className="font-semibold">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">Pay in cash when your parcel arrives. No advance payment needed.</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-36 lg:col-span-2">
        <h2 className="text-lg font-semibold text-navy">Your order</h2>
        {quoteError && (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {quoteError}
          </p>
        )}
        <ul className="divide-y">
          {(quote?.lines ?? []).map((l) => (
            <li key={`${l.productId}:${l.variantId ?? ""}`} className="flex gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {l.image && <Image src={l.image} alt={l.name} fill sizes="56px" className="object-cover" />}
                <span className="absolute -top-0 -right-0 rounded-bl-lg bg-navy px-1.5 text-[11px] font-bold text-white">{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-2 font-medium">{l.name}</span>
                {l.variantLabel && <span className="block text-xs text-muted-foreground">{l.variantLabel}</span>}
                {l.issue && <span className="block text-xs font-medium text-destructive">{ISSUE_TEXT[l.issue]}</span>}
              </span>
              <span className="text-sm font-semibold">{money(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        {quote && (
          <dl className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold">{money(quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold">{quote.shippingFee === 0 ? "Free" : money(quote.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <dt className="font-semibold">Total (Cash on Delivery)</dt>
              <dd className="font-bold text-navy">{money(quote.total)}</dd>
            </div>
          </dl>
        )}
        {blocking && (
          <p className="text-sm text-destructive">
            Some items are unavailable. Please{" "}
            <Link href="/cart" className="font-semibold underline">
              update your cart
            </Link>
            .
          </p>
        )}
        <Button type="submit" size="lg" disabled={placing || blocking || !quote || quote.itemCount === 0} className="h-12 w-full bg-orange-brand text-base text-white hover:bg-orange-brand/90">
          {placing ? (
            <>
              <Loader2 className="animate-spin" /> Placing order…
            </>
          ) : (
            <>
              <Lock /> Place Order
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By placing your order you agree to be contacted by phone/WhatsApp to confirm it.
        </p>
      </aside>
    </form>
  );
}
