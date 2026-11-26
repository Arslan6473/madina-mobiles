import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { calculateShipping, effectiveUnitPrice, regularUnitPrice, variantLabel } from "@/lib/pricing";
import type { CartLineInput } from "@/lib/validation";
import { getStoreSettings } from "./settings";

export type QuotedLine = {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  sku: string;
  image?: string;
  variantLabel?: string;
  unitPrice: number;
  regularPrice: number;
  requestedQty: number;
  quantity: number;
  availableStock: number;
  lineTotal: number;
  /** Set when the line can't be fulfilled as requested. */
  issue?: "unavailable" | "out_of_stock" | "insufficient_stock" | "variant_required";
};

export type CartQuote = {
  lines: QuotedLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  hasIssues: boolean;
};

/** Merges duplicate (product, variant) lines so stock checks see the full requested quantity. */
export function mergeLines(lines: CartLineInput[]) {
  const map = new Map<string, CartLineInput>();
  for (const l of lines) {
    const key = `${l.productId}:${l.variantId ?? ""}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, quantity: prev.quantity + l.quantity } : { ...l });
  }
  return [...map.values()];
}

/**
 * Authoritative price & stock calculation. Never trusts prices from the client —
 * only product IDs, variant IDs and quantities are taken from the request.
 */
export async function quoteCart(input: CartLineInput[]): Promise<CartQuote> {
  await connectDB();
  const settings = await getStoreSettings();
  const lines = mergeLines(input);
  const ids = [...new Set(lines.map((l) => l.productId))].map((id) => new Types.ObjectId(id));
  const products = await Product.find({ _id: { $in: ids } })
    .select("name slug sku images price salePrice stock variants isPublished")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const quoted: QuotedLine[] = lines.map((line) => {
    const p = byId.get(line.productId);
    if (!p || !p.isPublished) {
      return {
        productId: line.productId,
        variantId: line.variantId,
        name: "Unavailable product",
        slug: "",
        sku: "",
        unitPrice: 0,
        regularPrice: 0,
        requestedQty: line.quantity,
        quantity: 0,
        availableStock: 0,
        lineTotal: 0,
        issue: "unavailable",
      };
    }
    const variants = (p.variants ?? []) as unknown as {
      _id: Types.ObjectId;
      sku?: string;
      attributes: { name: string; value: string }[];
      price?: number;
      salePrice?: number;
      stock: number;
    }[];
    const variant = line.variantId ? variants.find((v) => String(v._id) === line.variantId) : undefined;
    const base = {
      productId: line.productId,
      variantId: variant ? String(variant._id) : undefined,
      name: p.name,
      slug: p.slug,
      sku: variant?.sku || p.sku,
      image: p.images?.[0]?.url,
      variantLabel: variant ? variantLabel(variant.attributes) : undefined,
      requestedQty: line.quantity,
    };

    if (variants.length && !variant) {
      return {
        ...base,
        unitPrice: effectiveUnitPrice(p),
        regularPrice: regularUnitPrice(p),
        quantity: 0,
        availableStock: 0,
        lineTotal: 0,
        issue: "variant_required" as const,
      };
    }

    const stock = variant ? variant.stock : p.stock;
    const unitPrice = effectiveUnitPrice(p, variant);
    const quantity = Math.min(line.quantity, Math.max(0, stock));
    return {
      ...base,
      unitPrice,
      regularPrice: regularUnitPrice(p, variant),
      quantity,
      availableStock: stock,
      lineTotal: unitPrice * quantity,
      issue: stock <= 0 ? ("out_of_stock" as const) : quantity < line.quantity ? ("insufficient_stock" as const) : undefined,
    };
  });

  const subtotal = quoted.reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = calculateShipping(subtotal, settings);
  return {
    lines: quoted,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    itemCount: quoted.reduce((s, l) => s + l.quantity, 0),
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    deliveryCharge: settings.deliveryCharge,
    hasIssues: quoted.some((l) => l.issue),
  };
}
