import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/login-form";
import { safeNextPath } from "@/components/account/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Madina Mobile Gadgets account to track orders and manage addresses.",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext);
  if (await getCurrentUser()) redirect(next ?? "/account");

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track your orders and check out faster."
      footer={
        <>
          New to Madina Mobile Gadgets?{" "}
          <Link href={registerHref} className="font-semibold text-royal hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
