"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CategoryIcon, WhatsAppIcon } from "@/components/shared/icons";
import { useStoreConfig } from "@/components/providers/store-provider";
import { generalInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import { HeaderSearch } from "./header-search";
import { MAIN_LINKS, type NavCategory } from "./nav-links";

export function MobileNav({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const store = useStoreConfig();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex size-11 items-center justify-center rounded-full text-navy hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[88%] gap-0 overflow-y-auto p-0 sm:max-w-sm">
        <SheetHeader className="bg-brand-gradient p-5 text-left text-white">
          <SheetTitle className="text-lg font-bold text-white">{store.storeName}</SheetTitle>
          <p className="text-xs text-white/80">{store.tagline}</p>
        </SheetHeader>
        <div className="p-4">
          <HeaderSearch />
        </div>
        <nav className="px-2" aria-label="Main">
          {MAIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 border-t px-2 pt-3">
          <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Categories</p>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
            >
              <CategoryIcon name={c.icon} className="size-4 text-royal" />
              {c.name}
            </Link>
          ))}
        </div>
        <div className="mt-auto grid gap-2 border-t p-4">
          <a
            href={whatsappLink(store.whatsapp, generalInquiryMessage(store.storeName))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white"
          >
            <WhatsAppIcon className="size-4" /> Chat on WhatsApp
          </a>
          <a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-navy">
            <Phone className="size-4" /> {store.phone}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
