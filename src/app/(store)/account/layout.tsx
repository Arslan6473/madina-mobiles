import { requireUserPage } from "@/lib/auth/guards";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/account");
  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <div className="bg-muted/40 pb-12">
      <div className="bg-brand-gradient text-white">
        <div className="container-page flex items-center gap-4 py-6 sm:py-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold ring-2 ring-white/25 sm:size-14">
            {initials || "?"}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white/75">Assalam o Alaikum,</p>
            <h1 className="truncate text-xl font-bold sm:text-2xl">{firstName}</h1>
            <p className="truncate text-xs text-white/70 sm:text-sm">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="container-page mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[230px_1fr] lg:gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-2 shadow-xs">
            <AccountNav />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
