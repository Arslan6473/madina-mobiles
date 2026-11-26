import { Suspense } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { CategoryIcon } from "@/components/shared/icons";
import { Logo } from "./logo";
import { HeaderSearch } from "./header-search";
import { CartButton } from "./cart-button";
import { AccountMenu } from "./account-menu";
import { MobileNav } from "./mobile-nav";
import { MAIN_LINKS, type NavCategory } from "./nav-links";
import type { SessionUser } from "@/types";

export function SiteHeader({
  categories,
  user,
  logoUrl,
  storeName,
}: {
  categories: NavCategory[];
  user: SessionUser | null;
  logoUrl?: string;
  storeName: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="container-page flex h-16 items-center gap-2 sm:h-[72px] sm:gap-4">
        <MobileNav categories={categories} />
        <Logo logoUrl={logoUrl} storeName={storeName} />
        <div className="mx-auto hidden w-full max-w-xl md:block">
          <Suspense>
            <HeaderSearch />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <AccountMenu user={user} />
          <CartButton />
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <Suspense>
          <HeaderSearch />
        </Suspense>
      </div>
      <nav className="hidden border-t bg-navy text-white lg:block" aria-label="Main">
        <div className="container-page flex h-11 items-center gap-1 text-sm">
          <div className="group relative">
            <Link
              href="/shop"
              className="flex h-11 items-center gap-2 bg-orange-brand px-4 font-semibold text-white transition hover:bg-orange-brand/90"
            >
              <LayoutGrid className="size-4" /> All Categories <ChevronDown className="size-4" />
            </Link>
            <div className="invisible absolute top-full left-0 z-50 w-72 translate-y-1 rounded-b-xl border bg-popover p-2 text-foreground opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted hover:text-royal"
                >
                  <CategoryIcon name={c.icon} className="size-4 text-royal" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          {MAIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 font-medium text-white/90 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
