import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/account/auth-shell";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length >= 10;

  return (
    <AuthShell
      title={valid ? "Set a new password" : "Invalid reset link"}
      subtitle={valid ? "Choose a strong password you haven't used before." : undefined}
      footer={
        <Link href="/login" className="font-semibold text-royal hover:underline">
          Back to sign in
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-brand/10 text-red-brand">
            <LinkIcon className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            This password reset link is missing or incomplete. Please request a new one — links are valid for 1 hour.
          </p>
          <Link href="/forgot-password" className={cn(buttonVariants(), "h-11 w-full rounded-xl bg-navy text-white hover:bg-navy-900")}>
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
