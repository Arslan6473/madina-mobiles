"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { forgotPasswordAction } from "@/actions/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { FormAlert, FormField, TextInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof forgotPasswordSchema>;
type Output = z.output<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await forgotPasswordAction(values);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, ["email"]);
      setFormError(res.error);
      return;
    }
    setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-royal/10 text-royal">
          <MailCheck className="size-7" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-navy">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent a link to reset
            your password. The link is valid for 1 hour. Don&apos;t forget to check your spam folder.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/login" className={cn(buttonVariants(), "h-11 rounded-xl bg-navy text-white hover:bg-navy-900")}>
            Back to sign in
          </Link>
          <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={formError} />
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
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-navy text-base text-white hover:bg-navy-900">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Send reset link
      </Button>
    </form>
  );
}
