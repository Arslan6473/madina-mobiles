"use client";

import { WhatsAppIcon } from "@/components/shared/icons";
import { useStoreConfig } from "@/components/providers/store-provider";
import { generalInquiryMessage, whatsappLink } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  const store = useStoreConfig();
  return (
    <a
      href={whatsappLink(store.whatsapp, generalInquiryMessage(store.storeName))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="no-print group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-whatsapp p-3.5 text-white shadow-lg shadow-black/20 transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp/40 [animation-duration:2.5s]" />
      <WhatsAppIcon className="size-7" />
      <span className="hidden pr-1 text-sm font-semibold sm:group-hover:inline">Chat with us</span>
    </a>
  );
}
