"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/actions/auth";
import { loginSchema } from "@/lib/validation";
import { FormAlert, FormField, PasswordInput, TextInput } from "./form-field";
import { applyServerErrors } from "./utils";

type Input = z.input<typeof loginSchema>;
type Output = z.output<typeof loginSchema>;

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: Output) => {
    setFormError(null);
    const res = await loginAction(values);
    if (!res.ok) {
      applyServerErrors(setError, res.fieldErrors, ["email", "password"]);
      setFormError(res.error);
      return;
    }
    toast.success(`Welcome back, ${res.data.name.split(" ")[0]}!`);
    router.replace(next ?? "/account");
    router.refresh();
  };

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
      <div className="space-y-1.5">
        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} />
        </FormField>
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-royal hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-navy text-base text-white hover:bg-navy-900">
        {isSubmitting && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
