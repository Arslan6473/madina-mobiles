"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Printer, Send, Truck } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { addOrderNoteAction, updateOrderStatusAction, updateOrderTrackingAction } from "@/actions/admin";
import { orderNoteSchema, orderTrackingSchema } from "@/lib/validation";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_TIMELINE, type OrderStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field } from "./field";
import { SimpleSelect } from "./simple-select";

export function PrintInvoiceButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer /> Print invoice
    </Button>
  );
}

export function OrderStatusForm({ orderId, orderNumber, current }: { orderId: string; orderNumber: string; current: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const locked = current === "delivered" || current === "cancelled";
  const nextIdx = ORDER_TIMELINE.indexOf(current) + 1;
  const suggested = ORDER_TIMELINE[nextIdx] ?? "";
  const [status, setStatus] = useState<string>(suggested);
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const submit = () =>
    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status, note });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[status as OrderStatus]}`);
      setNote("");
      setConfirmCancel(false);
      router.refresh();
    });

  if (locked)
    return (
      <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        This order is <strong className="text-foreground">{ORDER_STATUS_LABELS[current]}</strong> and can no longer be changed.
      </p>
    );

  return (
    <div className="grid gap-3">
      <Field label="New status" htmlFor="status">
        <SimpleSelect
          id="status"
          value={status}
          onValueChange={setStatus}
          placeholder="Choose status"
          options={ORDER_STATUSES.filter((s) => s !== current).map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
        />
      </Field>
      <Field label="Note (optional)" htmlFor="status-note" hint="Saved in the status history.">
        <Textarea id="status-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Button
        disabled={!status || pending}
        variant={status === "cancelled" ? "destructive" : "default"}
        className={status === "cancelled" ? undefined : "bg-navy hover:bg-navy/90"}
        onClick={() => (status === "cancelled" ? setConfirmCancel(true) : submit())}
      >
        {pending && <Loader2 className="animate-spin" />}
        {status === "cancelled" ? "Cancel order" : "Update status"}
      </Button>
      {status === "delivered" && (
        <p className="text-xs text-muted-foreground">Marking as delivered also records the COD payment as paid.</p>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={(o) => !pending && setConfirmCancel(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order #{orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              The items will be returned to stock. A cancelled order cannot be re-opened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Keep order</AlertDialogCancel>
            <Button variant="destructive" onClick={submit} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Yes, cancel order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type TrackingInput = z.input<typeof orderTrackingSchema>;
type TrackingParsed = z.output<typeof orderTrackingSchema>;

export function OrderTrackingForm({
  orderId,
  tracking,
}: {
  orderId: string;
  tracking?: { courier?: string; trackingNumber?: string; url?: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<TrackingInput, unknown, TrackingParsed>({
    resolver: zodResolver(orderTrackingSchema),
    defaultValues: {
      orderId,
      courier: tracking?.courier ?? "",
      trackingNumber: tracking?.trackingNumber ?? "",
      url: tracking?.url ?? "",
    },
  });
  const errors = form.formState.errors;
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await updateOrderTrackingAction(values);
      if (!res.ok) {
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) form.setError(k as keyof TrackingInput, { message: v[0] });
        toast.error(res.error);
        return;
      }
      toast.success("Tracking details saved");
      router.refresh();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Courier" htmlFor="courier" error={errors.courier?.message}>
          <Input id="courier" placeholder="e.g. TCS, Leopards, M&P" {...form.register("courier")} />
        </Field>
        <Field label="Tracking number" htmlFor="trackingNumber" error={errors.trackingNumber?.message}>
          <Input id="trackingNumber" className="font-mono" {...form.register("trackingNumber")} />
        </Field>
      </div>
      <Field label="Tracking URL" htmlFor="tracking-url" error={errors.url?.message}>
        <Input id="tracking-url" type="url" placeholder="https://" aria-invalid={!!errors.url} {...form.register("url")} />
      </Field>
      <Button type="submit" variant="outline" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="animate-spin" /> : <Truck />}
        Save tracking
      </Button>
    </form>
  );
}

type NoteInput = z.input<typeof orderNoteSchema>;

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<NoteInput>({ resolver: zodResolver(orderNoteSchema), defaultValues: { orderId, note: "" } });
  const errors = form.formState.errors;
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await addOrderNoteAction(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Note added");
      form.reset({ orderId, note: "" });
      router.refresh();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-2">
      <Textarea
        rows={2}
        maxLength={1000}
        placeholder="Add an internal note (not visible to the customer)…"
        aria-label="Internal note"
        aria-invalid={!!errors.note}
        {...form.register("note")}
      />
      {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        Add note
      </Button>
    </form>
  );
}
