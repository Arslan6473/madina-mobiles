import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Price } from "@/components/shared/price";
import { RatingStars } from "@/components/store/rating-stars";
import { QuickAddButton } from "@/components/store/quick-add-button";
import { discountPercent } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { ProductCardDTO } from "@/types";

export function ProductCard({ product, priority = false }: { product: ProductCardDTO; priority?: boolean }) {
  const href = `/product/${product.slug}`;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const outOfStock = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-muted" aria-label={product.name}>
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {onSale && (
            <span className="rounded-full bg-red-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              -{discountPercent(product.price, product.salePrice!)}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-sky-brand px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">New</span>
          )}
          {product.isBestSeller && (
            <span className="rounded-full bg-yellow-brand px-2 py-0.5 text-[11px] font-semibold text-navy-900 shadow-sm">
              Best Seller
            </span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-navy-900/80 py-1.5 text-center text-xs font-semibold text-white">
            Out of stock
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <span className="truncate">{product.brand}</span>
          {!outOfStock && product.stock <= LOW_STOCK_THRESHOLD && (
            <span className="shrink-0 text-orange-brand normal-case">Only {product.stock} left</span>
          )}
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-foreground">
          <Link href={href} className="hover:text-royal">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size="sm" />}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Price price={product.price} salePrice={product.salePrice} />
          <QuickAddButton product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: ProductCardDTO[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
