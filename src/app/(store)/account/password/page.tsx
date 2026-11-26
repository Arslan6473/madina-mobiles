import type { Metadata } from "next";
import { requireUserPage } from "@/lib/auth/guards";
import { SectionCard } from "@/components/account/section-card";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false },
};

export default async function ChangePasswordPage() {
  await requireUserPage("/account/password");
  return (
    <SectionCard title="Change password" description="Use a strong password that you don't use on other websites.">
      <ChangePasswordForm />
    </SectionCard>
  );
}
