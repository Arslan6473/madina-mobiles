"use client";

import { cn } from "@/lib/utils";
import { discountPercent } from "@/lib/format";
import { useMoney } from "@/components/providers/store-provider";

/** Displays the selling price, with the regular price struck through when on sale. */
export function Price({
  price,
  salePrice,
  className,
  size = "md",
  showDiscount = false,
}: {
  price: number;
  salePrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
}) {
  const money = useMoney();
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;
  const current = onSale ? salePrice : price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-bold text-navy",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl sm:text-3xl",
        )}
      >
        {money(current)}
      </span>
      {onSale && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
          {money(price)}
        </span>
      )}
      {onSale && showDiscount && (
        <span className="rounded-md bg-red-brand/10 px-1.5 py-0.5 text-xs font-semibold text-red-brand">
          -{discountPercent(price, salePrice)}%
        </span>
      )}
    </div>
  );
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  const money = useMoney();
  return <span className={className}>{money(amount)}</span>;
}
