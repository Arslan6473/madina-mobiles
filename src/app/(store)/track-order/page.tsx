import type { Metadata } from "next";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { TrackOrderForm } from "@/components/engagement/track-order-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the delivery status of your Madina Mobile Gadgets order with your order number and phone number.",
  alternates: { canonical: "/track-order" },
};

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <>
      <PageHero title="Track Your Order" description="Enter your order number and the phone number you used at checkout.">
        <PageBreadcrumbs items={[{ name: "Track Order" }]} />
      </PageHero>
      <div className="container-page max-w-4xl py-8">
        <TrackOrderForm initialOrderNumber={order?.slice(0, 30)} />
      </div>
    </>
  );
}
