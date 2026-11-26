import type { StoreSettingsDTO } from "@/types";

/** Public store settings needed by client components (no secrets live in settings). */
export type PublicStoreConfig = Pick<
  StoreSettingsDTO,
  "storeName" | "tagline" | "phone" | "whatsapp" | "address" | "city" | "currency" | "currencySymbol" | "deliveryCharge" | "freeDeliveryThreshold"
>;

export function toPublicConfig(s: StoreSettingsDTO): PublicStoreConfig {
  return {
    storeName: s.storeName,
    tagline: s.tagline,
    phone: s.phone,
    whatsapp: s.whatsapp,
    address: s.address,
    city: s.city,
    currency: s.currency,
    currencySymbol: s.currencySymbol,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
  };
}
