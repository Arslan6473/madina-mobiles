"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/actions/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { FormAlert, FormField, PASSWORD_HINT, PasswordInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof resetPasswordSchema>;
type Output = z.output<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await resetPasswordAction(values);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, ["password", "confirmPassword"]);
      setFormError(res.fieldErrors?.token ? "This reset link is invalid. Please request a new one." : res.error);
      return;
    }
    toast.success("Password updated. Please sign in with your new password.");
    router.replace("/login");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={formError ?? (errors.token ? "This reset link is invalid. Please request a new one." : null)} />
      <input type="hidden" {...register("token")} />
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
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-navy text-base text-white hover:bg-navy-900">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
