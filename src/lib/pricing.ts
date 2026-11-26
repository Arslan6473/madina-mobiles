/** Pure pricing rules shared by client display and server order calculation. */

export function effectiveUnitPrice(
  product: { price: number; salePrice?: number | null },
  variant?: { price?: number | null; salePrice?: number | null } | null,
) {
  const base = variant?.price ?? product.price;
  const sale = variant ? (variant.salePrice ?? (variant.price == null ? product.salePrice : undefined)) : product.salePrice;
  return sale != null && sale > 0 && sale < base ? sale : base;
}

export function regularUnitPrice(
  product: { price: number },
  variant?: { price?: number | null } | null,
) {
  return variant?.price ?? product.price;
}

export type ShippingRules = { deliveryCharge: number; freeDeliveryThreshold: number };

/** Delivery is free when subtotal reaches the threshold (threshold 0 disables free delivery). */
export function calculateShipping(subtotal: number, rules: ShippingRules) {
  if (subtotal <= 0) return 0;
  if (rules.freeDeliveryThreshold > 0 && subtotal >= rules.freeDeliveryThreshold) return 0;
  return rules.deliveryCharge;
}

export function variantLabel(attributes: { name: string; value: string }[]) {
  return attributes.map((a) => a.value).join(" / ");
}
