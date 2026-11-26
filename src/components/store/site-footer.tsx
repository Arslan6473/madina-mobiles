import Link from "next/link";
import { Clock, MapPin, Phone, ShieldCheck, Truck, Wallet } from "lucide-react";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/shared/icons";
import { generalInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import type { StoreSettingsDTO } from "@/types";
import type { NavCategory } from "./nav-links";

export function SiteFooter({ settings, categories }: { settings: StoreSettingsDTO; categories: NavCategory[] }) {
  const socials = [
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: settings.social.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((s) => !!s.href);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-navy-900 text-white/80">
      <div className="border-b border-white/10">
        <div className="container-page grid grid-cols-2 gap-4 py-6 text-sm md:grid-cols-4">
          {[
            { Icon: Truck, title: "Nationwide Delivery", text: "All over Pakistan" },
            { Icon: Wallet, title: "Cash on Delivery", text: "Pay when you receive" },
            { Icon: ShieldCheck, title: "Quality Checked", text: "Original products" },
            { Icon: Clock, title: "Quick Response", text: "WhatsApp support" },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-yellow-brand">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-white">{title}</span>
                <span className="text-xs text-white/60">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="leading-none">
            <div className="text-2xl font-black text-red-brand">MADINA</div>
            <div className="text-[11px] font-bold tracking-[0.18em] text-sky-300">MOBILE GADGETS</div>
          </div>
          <p className="text-sm">{settings.tagline}. Original mobile accessories at the best wholesale and retail prices in Haroonabad.</p>
          {settings.ownerName && <p className="text-sm">Owner: <span className="font-semibold text-white">{settings.ownerName}</span></p>}
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-orange-brand"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Categories</h2>
          <ul className="grid gap-2 text-sm">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-yellow-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Customer Care</h2>
          <ul className="grid gap-2 text-sm">
            {[
              ["/track-order", "Track your order"],
              ["/account/orders", "My orders"],
              ["/cart", "Shopping cart"],
              ["/contact", "Contact us"],
              ["/about", "About us"],
              ["/shop", "Shop all products"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-yellow-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Visit / Contact</h2>
          <ul className="grid gap-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-yellow-brand" />
              <span>
                {settings.address}, {settings.city}, {settings.country}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-yellow-brand" />
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-yellow-brand">
                {settings.phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(settings.whatsapp, generalInquiryMessage(settings.storeName))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 font-semibold text-white transition hover:bg-whatsapp/90"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp {settings.whatsapp}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {year} {settings.storeName}. All rights reserved.
          </p>
          <p>Cash on Delivery · Wholesale & Retail</p>
        </div>
      </div>
    </footer>
  );
}
