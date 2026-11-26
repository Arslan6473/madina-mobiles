"use client";

import { createContext, useContext, useMemo } from "react";
import { formatPrice, type CurrencyConfig } from "@/lib/format";
import type { PublicStoreConfig } from "@/lib/store-config";

export type { PublicStoreConfig };

const StoreContext = createContext<PublicStoreConfig | null>(null);

export function StoreProvider({ config, children }: { config: PublicStoreConfig; children: React.ReactNode }) {
  return <StoreContext.Provider value={config}>{children}</StoreContext.Provider>;
}

export function useStoreConfig() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreConfig must be used inside <StoreProvider>");
  return ctx;
}

/** Returns a price formatter bound to the store currency. */
export function useMoney() {
  const { currency, currencySymbol } = useStoreConfig();
  return useMemo(() => {
    const cfg: CurrencyConfig = { currency, currencySymbol };
    return (amount: number) => formatPrice(amount, cfg);
  }, [currency, currencySymbol]);
}
