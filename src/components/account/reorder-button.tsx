"use client";

import { useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderAction } from "@/actions/account";
import { useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

type ItemRef = { productId: string; variantId?: string; name: string; variantLabel?: string };

const lineName = (l: { name: string; variantLabel?: string }) => (l.variantLabel ? `${l.name} (${l.variantLabel})` : l.name);

/**
 * Re-quotes a past order at CURRENT prices/stock and adds what's available to the cart.
 * `items` are the original order lines, used to name products that no longer exist.
 */
export function ReorderButton({ orderId, items, className }: { orderId: string; items: ItemRef[]; className?: string }) {
  const [pending, startTransition] = useTransition();
  const addItem = useCart((s) => s.addItem);
  const setOpen = useCart((s) => s.setOpen);

  const reorder = () =>
    startTransition(async () => {
      const res = await reorderAction(orderId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const unavailable: string[] = [];
      const reduced: string[] = [];
      let addedLines = 0;

      for (const line of res.data) {
        const original = items.find((i) => i.productId === line.productId && (i.variantId ?? "") === (line.variantId ?? ""));
        const label = line.issue === "unavailable" && original ? lineName(original) : lineName(line);
        if (line.quantity <= 0 || line.issue === "unavailable" || line.issue === "out_of_stock" || line.issue === "variant_required") {
          unavailable.push(label);
          continue;
        }
        const result = addItem({
          productId: line.productId,
          variantId: line.variantId,
          variantLabel: line.variantLabel,
          name: line.name,
          slug: line.slug,
          image: line.image,
          unitPrice: line.unitPrice,
          regularPrice: line.regularPrice,
          maxStock: line.availableStock,
          quantity: line.quantity,
        });
        if (result.added > 0) addedLines++;
        if (line.issue === "insufficient_stock" || result.capped) reduced.push(label);
      }

      if (addedLines > 0) {
        toast.success(`Added ${addedLines} ${addedLines === 1 ? "item" : "items"} to your cart at today's prices.`);
        setOpen(true);
      } else if (!unavailable.length) {
        toast.info("These items are already in your cart at the maximum available quantity.");
        setOpen(true);
      }
      if (unavailable.length) {
        toast.warning(`Not available right now: ${unavailable.join(", ")}`, { duration: 8000 });
      }
      if (reduced.length) {
        toast.message(`Limited stock — quantity reduced for: ${reduced.join(", ")}`, { duration: 8000 });
      }
    });

  return (
    <Button
      type="button"
      onClick={reorder}
      disabled={pending}
      className={cn("h-11 rounded-xl bg-orange-brand px-5 text-white hover:bg-orange-brand/90", className)}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
      Reorder
    </Button>
  );
}
