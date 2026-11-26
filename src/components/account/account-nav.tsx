"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile", Icon: UserRound, exact: true },
  { href: "/account/orders", label: "Orders", Icon: Package },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/account/password", label: "Change password", Icon: KeyRound },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await logoutAction();
      toast.success("You have been signed out.");
      router.replace("/");
      router.refresh();
    });

  const itemClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition",
      active ? "bg-navy text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-navy",
    );

  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:overflow-visible">
      <ul className="flex gap-1.5 pb-1 lg:flex-col lg:pb-0">
        {LINKS.map(({ href, label, Icon, ...rest }) => {
          const active = "exact" in rest ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-2 lg:border-t lg:pt-2">
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className={cn(itemClass(false), "w-full text-red-brand hover:bg-red-brand/10 hover:text-red-brand disabled:opacity-60")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
