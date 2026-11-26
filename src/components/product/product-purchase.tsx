"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, CheckCircle2, ShoppingCart, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/shared/price";
import { WhatsAppIcon } from "@/components/shared/icons";
import { QtyStepper } from "@/components/store/cart-sheet";
import { useMoney, useStoreConfig } from "@/components/providers/store-provider";
import { useCart } from "@/stores/cart";
import { effectiveUnitPrice, regularUnitPrice } from "@/lib/pricing";
import { productInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types";

type Props = {
  product: Pick<
    ProductDTO,
    "id" | "name" | "slug" | "price" | "salePrice" | "stock" | "variants" | "images" | "wholesalePrice" | "wholesaleMinQty"
  >;
};

export function ProductPurchase({ product }: Props) {
  const router = useRouter();
  const store = useStoreConfig();
  const money = useMoney();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const hasVariants = product.variants.length > 0;
  const attributeNames = useMemo(
    () => [...new Set(product.variants.flatMap((v) => v.attributes.map((a) => a.name)))],
    [product.variants],
  );
  // Preselect the first in-stock variant so the price/stock shown is concrete.
  const initial = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(initial?.attributes.map((a) => [a.name, a.value]) ?? []),
  );
  const [qty, setQty] = useState(1);

  const variant = hasVariants
    ? product.variants.find((v) => attributeNames.every((n) => v.attributes.find((a) => a.name === n)?.value === selected[n]))
    : undefined;
  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const unitPrice = effectiveUnitPrice(product, variant);
  const regular = regularUnitPrice(product, variant);
  const inStock = stock > 0 && (!hasVariants || !!variant);
  const quantity = Math.min(qty, Math.max(1, stock));

  const optionsFor = (name: string) =>
    [...new Set(product.variants.flatMap((v) => v.attributes.filter((a) => a.name === name).map((a) => a.value)))];
  const optionAvailable = (name: string, value: string) =>
    product.variants.some(
      (v) =>
        v.stock > 0 &&
        v.attributes.some((a) => a.name === name && a.value === value) &&
        attributeNames.every((n) => n === name || !selected[n] || v.attributes.find((a) => a.name === n)?.value === selected[n]),
    );

  const add = () => {
    if (hasVariants && !variant) {
      toast.error("Please choose an option first.");
      return false;
    }
    const { added, capped } = addItem({
      productId: product.id,
      variantId: variant?.id,
      variantLabel: variant?.label,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      unitPrice,
      regularPrice: regular,
      maxStock: stock,
      quantity,
    });
    if (added <= 0) {
      toast.warning(`Only ${stock} available — they're already in your cart.`);
      return false;
    }
    if (capped) toast.info(`Only ${stock} available, so we added what's in stock.`);
    return true;
  };

  const waHref = whatsappLink(
    store.whatsapp,
    productInquiryMessage({ name: product.name, variantLabel: variant?.label, url: absoluteUrl(`/product/${product.slug}`) }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Price price={regular} salePrice={unitPrice < regular ? unitPrice : undefined} size="lg" showDiscount />
        {product.wholesalePrice ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Boxes className="size-4 text-orange-brand" />
            Wholesale price available{product.wholesaleMinQty ? ` on ${product.wholesaleMinQty}+ pieces` : ""} — ask on WhatsApp.
          </p>
        ) : null}
      </div>

      {attributeNames.map((name) => (
        <fieldset key={name}>
          <legend className="mb-2 text-sm font-semibold text-navy">
            {name}: <span className="font-normal text-muted-foreground">{selected[name] ?? "Select"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {optionsFor(name).map((value) => {
              const active = selected[name] === value;
              const available = optionAvailable(name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [name]: value }));
                    setQty(1);
                  }}
                  className={cn(
                    "min-w-12 rounded-xl border-2 px-3.5 py-2 text-sm font-medium transition",
                    active ? "border-royal bg-royal/5 text-royal" : "border-border hover:border-royal/50",
                    !available && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="text-sm">
        {inStock ? (
          <p className="flex items-center gap-1.5 font-medium text-emerald-600">
            <CheckCircle2 className="size-4" />
            {stock <= LOW_STOCK_THRESHOLD ? `Only ${stock} left in stock — order soon` : "In stock"}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 font-medium text-destructive">
            <XCircle className="size-4" /> {hasVariants && !variant ? "This combination is not available" : "Out of stock"}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={quantity} max={Math.max(1, stock)} onChange={(q) => setQty(Math.max(1, Math.min(q, stock)))} label={product.name} size="lg" />
        <span className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{money(unitPrice * quantity)}</span>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={!inStock}
          className="h-12 rounded-full bg-royal text-base hover:bg-royal/90"
          onClick={() => {
            if (add())
              toast.success("Added to cart", {
                description: variant ? `${product.name} (${variant.label})` : product.name,
                action: { label: "View cart", onClick: () => setOpen(true) },
              });
          }}
        >
          <ShoppingCart /> Add to Cart
        </Button>
        <Button
          size="lg"
          disabled={!inStock}
          className="h-12 rounded-full bg-orange-brand text-base text-white hover:bg-orange-brand/90"
          onClick={() => {
            if (add()) router.push("/checkout");
          }}
        >
          <Zap /> Buy Now
        </Button>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({
          variant: "outline",
          size: "lg",
          className: "h-12 w-full rounded-full border-whatsapp text-base text-whatsapp hover:bg-whatsapp hover:text-white",
        })}
      >
        <WhatsAppIcon /> Ask about this product on WhatsApp
      </a>
    </div>
  );
}
