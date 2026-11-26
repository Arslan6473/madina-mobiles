"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteAddressAction, setDefaultAddressAction } from "@/actions/account";
import { formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AddressDTO } from "@/types";
import { AddressForm } from "./address-form";

const MAX_ADDRESSES = 10;

export function AddressBook({
  addresses,
  defaults,
}: {
  addresses: AddressDTO[];
  defaults?: { fullName?: string; phone?: string };
}) {
  const router = useRouter();
  // `editing`: undefined = closed, null = new address, AddressDTO = editing that address.
  const [editing, setEditing] = useState<AddressDTO | null | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);
  const [deleting, setDeleting] = useState<AddressDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openForm = (address: AddressDTO | null) => {
    setFormKey((k) => k + 1);
    setEditing(address);
  };
  const canAdd = addresses.length < MAX_ADDRESSES;

  const makeDefault = (address: AddressDTO) => {
    setBusyId(address.id);
    startTransition(async () => {
      const res = await setDefaultAddressAction(address.id);
      if (res.ok) {
        toast.success(`"${address.label}" is now your default address.`);
        router.refresh();
      } else toast.error(res.error);
      setBusyId(null);
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setBusyId(target.id);
    startTransition(async () => {
      const res = await deleteAddressAction(target.id);
      if (res.ok) {
        toast.success("Address deleted.");
        setDeleting(null);
        router.refresh();
      } else toast.error(res.error);
      setBusyId(null);
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-navy">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">
            {addresses.length
              ? `${addresses.length} of ${MAX_ADDRESSES} addresses saved. Your default address is pre-filled at checkout.`
              : "Save your delivery addresses for faster checkout."}
          </p>
        </div>
        {addresses.length > 0 && (
          <Button
            type="button"
            onClick={() => openForm(null)}
            disabled={!canAdd}
            className="h-10 rounded-xl bg-navy px-4 text-white hover:bg-navy-900"
          >
            <Plus /> Add address
          </Button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-orange-brand/10 text-orange-brand">
            <MapPin className="size-7" />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">You haven&apos;t saved any addresses yet.</p>
          <Button type="button" onClick={() => openForm(null)} className="h-10 rounded-xl bg-navy px-5 text-white hover:bg-navy-900">
            <Plus /> Add your first address
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => {
            const busy = pending && busyId === a.id;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex flex-col rounded-2xl border p-4 transition",
                  a.isDefault ? "border-royal/50 bg-royal/[0.03] ring-1 ring-royal/20" : "hover:border-navy/30",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-navy">
                    <MapPin className="size-4 text-royal" /> {a.label}
                  </p>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-royal px-2 py-0.5 text-[11px] font-semibold text-white">
                      <CheckCircle2 className="size-3" /> Default
                    </span>
                  )}
                </div>
                <address className="flex-1 space-y-0.5 text-sm not-italic text-muted-foreground">
                  <p className="font-medium text-foreground">{a.fullName}</p>
                  <p>{a.address}</p>
                  <p>{[a.city, a.province, a.postalCode].filter(Boolean).join(", ")}</p>
                  <p className="flex items-center gap-1.5 pt-1">
                    <Phone className="size-3.5" /> {formatPhone(a.phone)}
                  </p>
                </address>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openForm(a)} disabled={busy}>
                    <Pencil /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-brand hover:bg-red-brand/10 hover:text-red-brand"
                    onClick={() => setDeleting(a)}
                    disabled={busy}
                  >
                    <Trash2 /> Delete
                  </Button>
                  {!a.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-royal hover:bg-royal/10 hover:text-royal"
                      onClick={() => makeDefault(a)}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="animate-spin" /> : <Star />} Set as default
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy">{editing ? "Edit address" : "Add a new address"}</DialogTitle>
            <DialogDescription>We deliver all over Pakistan with Cash on Delivery.</DialogDescription>
          </DialogHeader>
          {editing !== undefined && (
            <AddressForm
              key={formKey}
              address={editing ?? undefined}
              defaults={{ ...defaults, isDefault: addresses.length === 0 }}
              onCancel={() => setEditing(undefined)}
              onSaved={() => {
                setEditing(undefined);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && !pending && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `"${deleting.label}" — ${deleting.address}, ${deleting.city}` : ""}. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
