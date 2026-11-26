"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, MapPin, Package, User, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/types";

export function AccountMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-navy transition hover:bg-muted"
      >
        <UserRound className="size-6" />
        <span className="hidden lg:inline">Login / Register</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-navy transition hover:bg-muted"
        aria-label="Account menu"
      >
        <UserRound className="size-6" />
        <span className="hidden max-w-28 truncate lg:inline">{user.name.split(" ")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <LayoutDashboard /> Admin panel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link href="/account" />}>
          <User /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/orders" />}>
          <Package /> My orders
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/addresses" />}>
          <MapPin /> Addresses
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await logoutAction();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
