"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { adminLoginAction } from "@/actions/auth";
import { loginSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./field";

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await adminLoginAction(values);
      if (!res.ok) {
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) form.setError(k as "email" | "password", { message: v[0] });
        form.setError("root", { message: res.error });
        return;
      }
      toast.success(`Welcome back, ${res.data.name}`);
      router.replace("/admin");
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {errors.root?.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {errors.root.message}
        </p>
      )}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          className="h-10"
          aria-invalid={!!errors.email}
          {...form.register("email")}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-10"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
      </Field>
      <Button type="submit" size="lg" className="mt-2 h-10 bg-navy hover:bg-navy/90" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
        Sign in to admin
      </Button>
    </form>
  );
}
