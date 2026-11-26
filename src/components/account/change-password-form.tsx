"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/actions/account";
import { changePasswordSchema } from "@/lib/validation";
import { FormAlert, FormField, PASSWORD_HINT, PasswordInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof changePasswordSchema>;
type Output = z.output<typeof changePasswordSchema>;
const EMPTY = { currentPassword: "", password: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await changePasswordAction(values);
    if (!res.ok) {
      const applied = applyServerErrors(setError, res.fieldErrors, ["currentPassword", "password", "confirmPassword"]);
      if (!applied) setFormError(res.error);
      return;
    }
    reset(EMPTY);
    toast.success("Password changed. Other devices have been signed out.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      <FormAlert message={formError} />
      <FormField id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          invalid={!!errors.currentPassword}
          {...register("currentPassword")}
        />
      </FormField>
      <FormField id="password" label="New password" error={errors.password?.message} hint={PASSWORD_HINT}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </FormField>
      <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>
      <p className="flex gap-2 rounded-xl bg-sky-brand/10 px-3.5 py-2.5 text-xs text-sky-900">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        For your security, changing your password signs you out on all other devices. You&apos;ll stay signed in here.
      </p>
      <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl bg-navy px-6 text-white hover:bg-navy-900">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
