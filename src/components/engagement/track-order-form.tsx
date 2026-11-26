"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/account/form-field";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { useMoney } from "@/components/providers/store-provider";
import { trackOrderSchema } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { trackOrderAction } from "@/actions/checkout";
import type { TrackedOrder } from "@/services/orders";

type Input = z.input<typeof trackOrderSchema>;

export function TrackOrderForm({ initialOrderNumber }: { initialOrderNumber?: string }) {
  const money = useMoney();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { orderNumber: initialOrderNumber ?? "", phone: "" },
  });

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setError(undefined);
            const res = await trackOrderAction(values);
            if (res.ok) setOrder(res.data);
            else {
              setOrder(null);
              setError(res.error);
            }
          }),
        )}
        className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start sm:p-6"
      >
        <FormField id="orderNumber" label="Order number" error={errors.orderNumber?.message}>
          <Input id="orderNumber" placeholder="e.g. MMG-250101-ABCD" className="uppercase" {...register("orderNumber")} />
        </FormField>
        <FormField id="phone" label="Phone number used at checkout" error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="tel" placeholder="03XX-XXXXXXX" {...register("phone")} />
        </FormField>
        <Button type="submit" size="lg" disabled={pending} className="h-9 sm:mt-6">
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Track
        </Button>
      </form>

      {error && (
        <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {order && (
        <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy">Order {order.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">
                Placed {formatDate(order.createdAt, true)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · {money(order.total)} ·
                Delivery to {order.city}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <OrderTimeline status={order.status} history={order.statusHistory} />
          {order.tracking?.trackingNumber && (
            <p className="rounded-xl bg-muted/60 p-3 text-sm">
              {order.tracking.courier && <span className="font-semibold">{order.tracking.courier}: </span>}
              Tracking # <span className="font-mono">{order.tracking.trackingNumber}</span>
              {order.tracking.url && (
                <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-royal hover:underline">
                  Track parcel
                </a>
              )}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
