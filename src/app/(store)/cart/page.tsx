import type { Metadata } from "next";
import { CartView } from "@/components/checkout/cart-view";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Shopping Cart">
        <PageBreadcrumbs items={[{ name: "Cart" }]} />
      </PageHero>
      <div className="container-page py-8">
        <CartView />
      </div>
    </>
  );
}
