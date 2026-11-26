import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Boxes, HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { getStoreSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "About Us",
  description: "Madina Mobile Gadgets — trusted mobile accessories wholesaler and retailer in Medical Bazaar, Haroonabad.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHero title={`About ${settings.storeName}`} description={settings.tagline}>
        <PageBreadcrumbs items={[{ name: "About" }]} />
      </PageHero>
      <div className="container-page space-y-12 py-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-foreground/85">
            <h2 className="text-2xl font-bold text-navy">Your trusted mobile accessories shop in Haroonabad</h2>
            <p>
              {settings.storeName} is located in {settings.address}, {settings.city}. Under the care of
              {settings.ownerName ? ` ${settings.ownerName}` : " our team"}, we supply original and high-quality mobile accessories to
              walk-in customers, online shoppers and shopkeepers across Pakistan.
            </p>
            <p>
              From fast chargers, data cables and power banks to earbuds, smart watches, covers and screen protectors — we keep the
              items people need every day, from the brands they trust, at fair retail and wholesale prices.
            </p>
            <p>
              Every order is checked before dispatch and delivered with Cash on Delivery, so you only pay when your parcel arrives.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/shop" className={buttonVariants({ size: "lg", className: "h-11 px-6" })}>
                Shop now
              </Link>
              <Link href="/contact" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-6" })}>
                Contact us
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border bg-white p-2 shadow-lg">
            <Image
              src="/brand/banner.jpg"
              alt={settings.storeName}
              width={1280}
              height={720}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full rounded-2xl"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: ShieldCheck, title: "Genuine products", text: "We stock original and trusted-brand accessories only." },
            { Icon: Boxes, title: "Wholesale & retail", text: "Single pieces for you, bulk rates for shopkeepers." },
            { Icon: Truck, title: "Nationwide COD", text: "Delivery across Pakistan with Cash on Delivery." },
            { Icon: HeartHandshake, title: "Honest service", text: "Friendly advice and quick WhatsApp support." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <Icon className="size-8 text-orange-brand" />
              <h3 className="mt-3 font-semibold text-navy">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
