"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/account/form-field";
import { inquirySchema } from "@/lib/validation";
import { submitInquiryAction } from "@/actions/engagement";

type Input = z.input<typeof inquirySchema>;
type Output = z.output<typeof inquirySchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "", website: "" },
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold">Message received</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thank you! We&apos;ll get back to you by phone or email soon.</p>
        <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          setError(undefined);
          const res = await submitInquiryAction(values);
          if (res.ok) {
            reset();
            setSent(true);
          } else {
            for (const [k, m] of Object.entries(res.fieldErrors ?? {})) if (m?.[0]) setFieldError(k as keyof Input, { message: m[0] });
            setError(res.error);
          }
        }),
      )}
      className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6"
    >
      <FormField id="name" label="Your name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>
      <FormField id="phone" label="Phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" inputMode="tel" placeholder="03XX-XXXXXXX" aria-invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField id="email" label="Email" optional error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField id="subject" label="Subject" optional error={errors.subject?.message}>
        <Input id="subject" placeholder="e.g. Wholesale rates" {...register("subject")} />
      </FormField>
      <FormField id="message" label="Message" error={errors.message?.message} className="sm:col-span-2">
        <Textarea id="message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
      </FormField>
      {/* Honeypot — hidden from people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {error && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="h-11 px-6">
          {pending ? <Loader2 className="animate-spin" /> : <Send />} Send message
        </Button>
      </div>
    </form>
  );
}
