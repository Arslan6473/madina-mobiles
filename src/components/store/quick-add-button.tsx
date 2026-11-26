"use client";

import Link from "next/link";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { effectiveUnitPrice } from "@/lib/pricing";
import type { ProductCardDTO } from "@/types";

/** Adds a simple product straight to the cart; products with variants link to the product page. */
export function QuickAddButton({ product }: { product: ProductCardDTO }) {
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  if (product.hasVariants) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className={buttonVariants({ size: "icon", variant: "outline", className: "rounded-full" })}
        aria-label={`Choose options for ${product.name}`}
        title="Choose options"
      >
        <SlidersHorizontal />
      </Link>
    );
  }

  const disabled = product.stock <= 0;
  return (
    <Button
      size="icon"
      className="rounded-full"
      disabled={disabled}
      aria-label={`Add ${product.name} to cart`}
      title={disabled ? "Out of stock" : "Add to cart"}
      onClick={() => {
        const { added, capped } = addItem({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image?.url,
          unitPrice: effectiveUnitPrice(product),
          regularPrice: product.price,
          maxStock: product.stock,
        });
        if (added > 0) {
          toast.success("Added to cart", { description: product.name, action: { label: "View cart", onClick: () => setOpen(true) } });
        } else if (capped) {
          toast.warning(`Only ${product.stock} in stock — you already have them all in your cart.`);
        }
      }}
    >
      <ShoppingCart />
    </Button>
  );
}
