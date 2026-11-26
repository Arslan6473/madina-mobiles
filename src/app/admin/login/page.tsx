import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { AdminLoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");

  return (
    <div className="bg-brand-gradient relative flex min-h-svh flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-orange-brand/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-sky-brand/20 blur-3xl" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center leading-none">
          <span className="text-4xl font-black tracking-tight text-red-brand drop-shadow-sm">MADINA</span>
          <span className="mt-1 text-xs font-bold tracking-[0.25em] text-sky-200">MOBILE GADGETS</span>
          <span className="mt-4 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
            Admin panel
          </span>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-navy-900/40 sm:p-8">
          <h1 className="text-xl font-bold text-navy">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Store staff only. Use your admin account.</p>
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-white/70">
          <Link href="/" className="hover:text-white hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
