import { Phone } from "lucide-react";
import { StoreProvider } from "@/components/providers/store-provider";
import { toPublicConfig } from "@/lib/store-config";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartSheet } from "@/components/store/cart-sheet";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";
import { getStoreSettings } from "@/services/settings";
import { getActiveCategories } from "@/services/catalog";
import { getCurrentUser } from "@/lib/auth/guards";

// Every storefront page reads live catalog/settings from MongoDB.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, user] = await Promise.all([getStoreSettings(), getActiveCategories(), getCurrentUser()]);
  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon }));

  return (
    <StoreProvider config={toPublicConfig(settings)}>
      {settings.announcementEnabled && settings.announcement && (
        <div className="bg-navy-900 text-xs text-white sm:text-sm">
          <div className="container-page flex h-9 items-center justify-center gap-4 sm:justify-between">
            <p className="truncate font-medium">
              <span className="mr-1.5 text-yellow-brand">★</span>
              {settings.announcement}
            </p>
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hidden shrink-0 items-center gap-1.5 text-white/80 hover:text-white sm:flex">
              <Phone className="size-3.5" /> {settings.phone}
            </a>
          </div>
        </div>
      )}
      <SiteHeader categories={navCategories} user={user} logoUrl={settings.logo?.url} storeName={settings.storeName} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} categories={navCategories} />
      <CartSheet />
      <WhatsAppFloat />
    </StoreProvider>
  );
}
