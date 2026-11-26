import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Package } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getUserProfile } from "@/services/account";
import { getUserOrders } from "@/services/orders";
import { formatDate } from "@/lib/format";
import { SectionCard } from "@/components/account/section-card";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

export default async function AccountProfilePage() {
  const user = await requireUserPage("/account");
  const [profile, orders] = await Promise.all([getUserProfile(user.id), getUserOrders(user.id)]);
  const addressCount = profile?.addresses.length ?? 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/account/orders"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition hover:border-royal/40 hover:shadow-md"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
            <Package className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-bold text-navy">{orders.length}</span>
            <span className="block truncate text-xs text-muted-foreground">{orders.length === 1 ? "Order" : "Orders"}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/account/addresses"
          className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition hover:border-royal/40 hover:shadow-md"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-brand/10 text-orange-brand">
            <MapPin className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-bold text-navy">{addressCount}</span>
            <span className="block truncate text-xs text-muted-foreground">Saved {addressCount === 1 ? "address" : "addresses"}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <SectionCard
        title="Profile details"
        description={profile ? `Member since ${formatDate(profile.createdAt)}` : "Update your name and mobile number."}
      >
        <ProfileForm name={profile?.name ?? user.name} email={user.email} phone={profile?.phone} />
      </SectionCard>
    </div>
  );
}
