"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { saveAddressAction } from "@/actions/account";
import { addressSchema } from "@/lib/validation";
import { PK_PROVINCES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AddressDTO } from "@/types";
import { FormAlert, FormField, TextInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof addressSchema>;
type Output = z.output<typeof addressSchema>;
const FIELDS = ["label", "fullName", "phone", "address", "city", "province", "postalCode", "isDefault"] as const;
const LABEL_PRESETS = ["Home", "Office", "Shop"];

export function AddressForm({
  address,
  defaults,
  onSaved,
  onCancel,
}: {
  address?: AddressDTO;
  /** Prefill for new addresses (e.g. the customer's name/phone). */
  defaults?: Partial<Pick<AddressDTO, "fullName" | "phone">> & { isDefault?: boolean };
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: address?.label ?? "Home",
      fullName: address?.fullName ?? defaults?.fullName ?? "",
      phone: address?.phone ?? defaults?.phone ?? "",
      address: address?.address ?? "",
      city: address?.city ?? "",
      province: address?.province ?? "",
      postalCode: address?.postalCode ?? "",
      isDefault: address?.isDefault ?? defaults?.isDefault ?? false,
    },
  });
  const label = useWatch({ control, name: "label" });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await saveAddressAction(values, address?.id);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, FIELDS);
      setFormError(res.error);
      return;
    }
    toast.success(address ? "Address updated." : "Address saved.");
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField id="addr-label" label="Label" error={errors.label?.message}>
        <div className="flex flex-wrap gap-2">
          {LABEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue("label", preset, { shouldDirty: true, shouldValidate: true })}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium transition",
                label === preset ? "border-navy bg-navy text-white" : "hover:border-navy/40 hover:text-navy",
              )}
            >
              {preset}
            </button>
          ))}
          <TextInput id="addr-label" placeholder="Custom label" invalid={!!errors.label} className="h-8 w-36 rounded-full text-xs sm:text-xs" {...register("label")} />
        </div>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="addr-fullName" label="Full name" error={errors.fullName?.message}>
          <TextInput id="addr-fullName" autoComplete="name" invalid={!!errors.fullName} {...register("fullName")} />
        </FormField>
        <FormField id="addr-phone" label="Mobile number" error={errors.phone?.message}>
          <TextInput
            id="addr-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="03XX-XXXXXXX"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </FormField>
      </div>
      <FormField id="addr-address" label="Complete address" error={errors.address?.message} hint="House no., street, area / mohalla, nearby landmark">
        <TextInput id="addr-address" autoComplete="street-address" invalid={!!errors.address} {...register("address")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="addr-city" label="City" error={errors.city?.message}>
          <TextInput id="addr-city" autoComplete="address-level2" placeholder="e.g. Haroonabad" invalid={!!errors.city} {...register("city")} />
        </FormField>
        <FormField id="addr-province" label="Province" optional error={errors.province?.message}>
          <select
            id="addr-province"
            autoComplete="address-level1"
            aria-invalid={!!errors.province || undefined}
            className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive sm:text-sm"
            {...register("province")}
          >
            <option value="">Select…</option>
            {PK_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="addr-postalCode" label="Postal code" optional error={errors.postalCode?.message}>
          <TextInput id="addr-postalCode" autoComplete="postal-code" inputMode="numeric" invalid={!!errors.postalCode} {...register("postalCode")} />
        </FormField>
      </div>
      {!address?.isDefault && (
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
              <Checkbox checked={!!field.value} onCheckedChange={(checked) => field.onChange(checked)} />
              Set as my default delivery address
            </label>
          )}
        />
      )}
      <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-10 rounded-xl bg-navy px-5 text-white hover:bg-navy-900">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {address ? "Save changes" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
