"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/actions/auth";
import { registerSchema } from "@/lib/validation";
import { FormAlert, FormField, PASSWORD_HINT, PasswordInput, TextInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof registerSchema>;
type Output = z.output<typeof registerSchema>;
const FIELDS = ["name", "email", "phone", "password", "confirmPassword"] as const;

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await registerAction(values);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, FIELDS);
      setFormError(res.error);
      return;
    }
    toast.success("Your account has been created. Welcome!");
    router.replace(next ?? "/account");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <FormField id="name" label="Full name" error={errors.name?.message}>
        <TextInput id="name" autoComplete="name" placeholder="Muhammad Ali" invalid={!!errors.name} {...register("name")} />
      </FormField>
      <FormField id="email" label="Email address" error={errors.email?.message}>
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>
      <FormField
        id="phone"
        label="Mobile number"
        optional
        error={errors.phone?.message}
        hint="Used for delivery updates, e.g. 0301-6597269"
      >
        <TextInput id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="03XX-XXXXXXX" invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.message} hint={PASSWORD_HINT}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </FormField>
      <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-navy text-base text-white hover:bg-navy-900">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
