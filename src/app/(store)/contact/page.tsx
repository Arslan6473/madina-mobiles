import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { ContactForm } from "@/components/engagement/contact-form";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { getStoreSettings } from "@/services/settings";
import { generalInquiryMessage, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Madina Mobile Gadgets in Haroonabad — call, WhatsApp or send us a message for retail and wholesale inquiries.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const mapQuery = encodeURIComponent(`${settings.address}, ${settings.city}, ${settings.country}`);

  return (
    <>
      <PageHero title="Contact Us" description="Questions about a product, your order or wholesale rates? We're happy to help.">
        <PageBreadcrumbs items={[{ name: "Contact" }]} />
      </PageHero>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border bg-card p-5 text-sm">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-royal" />
              <div>
                <p className="font-semibold text-navy">Visit our shop</p>
                <p className="text-muted-foreground">
                  {settings.address}, {settings.city}, {settings.country}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-royal hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 size-5 shrink-0 text-royal" />
              <div>
                <p className="font-semibold text-navy">Call us</p>
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="text-muted-foreground hover:text-royal">
                  {settings.phone}
                </a>
              </div>
            </div>
            {settings.email && (
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-royal" />
                <div>
                  <p className="font-semibold text-navy">Email</p>
                  <a href={`mailto:${settings.email}`} className="text-muted-foreground hover:text-royal">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-royal" />
              <div>
                <p className="font-semibold text-navy">Shop hours</p>
                <p className="text-muted-foreground">Monday – Saturday, 10:00 AM – 9:00 PM</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-navy-900 p-5 text-white">
            <p className="font-semibold">Fastest reply: WhatsApp</p>
            <p className="mt-1 text-sm text-white/70">Tap below to open a chat with {settings.ownerName || "us"} on WhatsApp.</p>
            <a
              href={whatsappLink(settings.whatsapp, generalInquiryMessage(settings.storeName))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: "mt-4 h-10 w-full bg-whatsapp text-white hover:bg-whatsapp/90" })}
            >
              <WhatsAppIcon /> Chat on WhatsApp
            </a>
          </div>
        </div>
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-lg font-semibold text-navy">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
