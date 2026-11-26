import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { AuthShell } from "@/components/account/auth-shell";
import { RegisterForm } from "@/components/account/register-form";
import { safeNextPath } from "@/components/account/utils";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Madina Mobile Gadgets account for faster checkout and order tracking.",
  robots: { index: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext);
  if (await getCurrentUser()) redirect(next ?? "/account");

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your addresses, track orders and reorder in one tap."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-royal hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
