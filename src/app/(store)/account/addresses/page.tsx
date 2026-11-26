import type { Metadata } from "next";
import { requireUserPage } from "@/lib/auth/guards";
import { getUserProfile } from "@/services/account";
import { SectionCard } from "@/components/account/section-card";
import { AddressBook } from "@/components/account/address-book";

export const metadata: Metadata = {
  title: "My addresses",
  robots: { index: false },
};

export default async function AccountAddressesPage() {
  const user = await requireUserPage("/account/addresses");
  const profile = await getUserProfile(user.id);
  const addresses = [...(profile?.addresses ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <SectionCard>
      <AddressBook addresses={addresses} defaults={{ fullName: profile?.name ?? user.name, phone: profile?.phone }} />
    </SectionCard>
  );
}
