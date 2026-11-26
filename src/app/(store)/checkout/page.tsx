import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { getCurrentUser } from "@/lib/auth/guards";
import { getUserProfile } from "@/services/account";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.id) : null;
  const address = profile?.addresses.find((a) => a.isDefault) ?? profile?.addresses[0];
  const defaults = profile
    ? {
        fullName: address?.fullName ?? profile.name,
        email: profile.email,
        phone: address?.phone ?? profile.phone ?? "",
        address: address?.address ?? "",
        city: address?.city ?? "",
        province: address?.province ?? "Punjab",
        postalCode: address?.postalCode ?? "",
      }
    : {};

  return (
    <>
      <PageHero title="Checkout">
        <PageBreadcrumbs items={[{ name: "Cart", href: "/cart" }, { name: "Checkout" }]} />
      </PageHero>
      <div className="container-page py-8">
        <CheckoutForm defaults={defaults} signedIn={!!user} />
      </div>
    </>
  );
}
