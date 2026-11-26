"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction, toggleProductFlagAction } from "@/actions/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Price } from "@/components/shared/price";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { ConfirmAction } from "./confirm-action";
import { EmptyState } from "./page-header";
import { StockBadge } from "./status-badges";
import type { ProductCardDTO } from "@/types";

type Row = ProductCardDTO & { sku: string; isPublished: boolean; categoryId?: string };
type Flag = "isPublished" | "isFeatured" | "isBestSeller" | "isNewArrival";

const FLAGS: { key: Flag; label: string }[] = [
  { key: "isPublished", label: "Live" },
  { key: "isFeatured", label: "Featured" },
  { key: "isBestSeller", label: "Best" },
  { key: "isNewArrival", label: "New" },
];

function FlagSwitch({ product, flag, label }: { product: Row; flag: Flag; label: string }) {
  const [pending, startTransition] = useTransition();
  const [value, setOptimistic] = useOptimistic(product[flag]);
  return (
    <Switch
      size="sm"
      aria-label={`${label}: ${product.name}`}
      checked={value}
      disabled={pending}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          setOptimistic(checked);
          const res = await toggleProductFlagAction(product.id, flag, checked);
          if (!res.ok) toast.error(res.error);
        })
      }
    />
  );
}

export function ProductsTable({ products }: { products: Row[] }) {
  if (!products.length)
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description="Try a different search or filter, or add your first product."
        action={
          <Link href="/admin/products/new" className={buttonVariants()}>
            Add product
          </Link>
        }
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="pl-4">Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          {FLAGS.map((f) => (
            <TableHead key={f.key} className="text-center">
              {f.label}
            </TableHead>
          ))}
          <TableHead className="pr-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="pl-4">
              <div className="flex min-w-56 items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {p.image ? (
                    <Image src={p.image.url} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <Package className="m-auto mt-3 size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium whitespace-normal hover:text-royal hover:underline">
                    {p.name}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {p.sku}
                    {p.hasVariants && <span className="ml-1.5 font-sans">· variants</span>}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{p.categoryName ?? "—"}</TableCell>
            <TableCell>
              <Price price={p.price} salePrice={p.salePrice} size="sm" />
            </TableCell>
            <TableCell>
              <StockBadge stock={p.stock} low={LOW_STOCK_THRESHOLD} />
            </TableCell>
            {FLAGS.map((f) => (
              <TableCell key={f.key} className="text-center">
                <FlagSwitch product={p} flag={f.key} label={f.label} />
              </TableCell>
            ))}
            <TableCell className="pr-4">
              <div className="flex justify-end gap-1">
                <Link href={`/admin/products/${p.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Edit ${p.name}`}>
                  <Pencil />
                </Link>
                <ConfirmAction
                  trigger={
                    <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Delete ${p.name}`}>
                      <Trash2 />
                    </Button>
                  }
                  title="Delete this product?"
                  description={
                    <>
                      <strong>{p.name}</strong> and its reviews and images will be permanently deleted. Past orders keep their
                      own copy of the item. Consider unpublishing instead.
                    </>
                  }
                  action={() => deleteProductAction(p.id)}
                  successMessage="Product deleted"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
