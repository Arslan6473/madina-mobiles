"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/actions/account";
import { profileSchema } from "@/lib/validation";
import { FormAlert, FormField, TextInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof profileSchema>;
type Output = z.output<typeof profileSchema>;

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(profileSchema), defaultValues: { name, phone: phone ?? "" } });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await updateProfileAction(values);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, ["name", "phone"]);
      setFormError(res.error);
      return;
    }
    reset({ name: values.name, phone: values.phone ?? "" });
    toast.success("Profile updated.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="name" label="Full name" error={errors.name?.message} className="sm:col-span-2">
          <TextInput id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField id="email" label="Email address" hint="Contact us on WhatsApp if you need to change your email.">
          <TextInput id="email" type="email" value={email} readOnly disabled className="bg-muted" />
        </FormField>
        <FormField id="phone" label="Mobile number" optional error={errors.phone?.message} hint="e.g. 0301-6597269">
          <TextInput id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="03XX-XXXXXXX" invalid={!!errors.phone} {...register("phone")} />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="h-11 rounded-xl bg-navy px-6 text-white hover:bg-navy-900">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
