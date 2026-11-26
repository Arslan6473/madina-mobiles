"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavCounts = { pendingOrders: number; newInquiries: number };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: "pendingOrders" as const },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail, count: "newInquiries" as const },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Wordmark({ storeName }: { storeName: string }) {
  return (
    <Link href="/admin" className="flex flex-col leading-none" aria-label={`${storeName} admin`}>
      <span className="text-xl font-black tracking-tight text-red-brand">MADINA</span>
      <span className="text-[10px] font-bold tracking-[0.18em] text-sky-200">MOBILE GADGETS</span>
    </Link>
  );
}

function SidebarContent({
  counts,
  user,
  storeName,
  onNavigate,
}: {
  counts: NavCounts;
  user: { name: string; email: string };
  storeName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await logoutAction();
      toast.success("Signed out");
      router.replace("/admin/login");
      router.refresh();
    });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
        <Wordmark storeName={storeName} />
        <span className="rounded-md bg-sidebar-primary/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sidebar-primary uppercase">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const count = item.count ? counts[item.count] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("size-4.5", active ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="min-w-5 rounded-full bg-sidebar-primary px-1.5 py-0.5 text-center text-[11px] leading-none font-bold text-sidebar-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-primary" aria-hidden />}
            </Link>
          );
        })}
        <div className="my-3 border-t border-sidebar-border" />
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <ExternalLink className="size-4.5 text-sidebar-foreground/60" />
          View store
        </Link>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={pending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4.5 animate-spin" /> : <LogOut className="size-4.5" />}
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  counts,
  user,
  storeName,
  children,
}: {
  counts: NavCounts;
  user: { name: string; email: string };
  storeName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-svh flex-1 bg-muted/40 print:bg-white">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent counts={counts} user={user} storeName={storeName} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarContent counts={counts} user={user} storeName={storeName} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <span className="font-black tracking-tight text-red-brand">MADINA</span>
          <span className="text-xs font-semibold text-muted-foreground">Admin</span>
          {counts.pendingOrders > 0 && (
            <Link
              href="/admin/orders?status=pending"
              className="ml-auto rounded-full bg-orange-brand/15 px-2.5 py-1 text-xs font-semibold text-orange-700"
            >
              {counts.pendingOrders} pending
            </Link>
          )}
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
