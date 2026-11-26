import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/product-card";
import { ShopSidebar, ShopToolbar } from "@/components/store/shop-filters";
import { getActiveCategories, getBrands, getPriceBounds, searchProducts } from "@/services/catalog";
import { shopQueryString, type ShopParams } from "@/lib/shop-params";
import { cn } from "@/lib/utils";

function pageWindow(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  return [...pages].sort((a, b) => a - b);
}

/** Shared product listing (filters + grid + pagination) for /shop and /category/[slug]. */
export async function ProductListing({ params, basePath, category }: { params: ShopParams; basePath: string; category?: string }) {
  const [result, brands, priceBounds, categories] = await Promise.all([
    searchProducts({ ...params, category }),
    getBrands(category),
    getPriceBounds(),
    getActiveCategories(),
  ]);
  const filterProps = {
    params,
    brands,
    priceBounds,
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, productCount: c.productCount })),
    activeCategory: category,
  };
  const href = (page: number) => `${basePath}${shopQueryString({ ...params, page })}`;
  const pages = pageWindow(result.page, result.totalPages);

  return (
    <div className="flex gap-8">
      <ShopSidebar {...filterProps} />
      <div className="min-w-0 flex-1">
        <ShopToolbar {...filterProps} total={result.total} />
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
            <PackageSearch className="size-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No products found</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try removing some filters or searching for something else. You can also ask us on WhatsApp — we may have it in stock.
            </p>
            <Link href={basePath} className={buttonVariants({ className: "mt-5" })}>
              Clear filters
            </Link>
          </div>
        ) : (
          <ProductGrid products={result.items} priorityCount={4} className="lg:grid-cols-3 xl:grid-cols-4" />
        )}

        {result.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
            {result.page > 1 && (
              <Link href={href(result.page - 1)} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Previous page">
                <ChevronLeft />
              </Link>
            )}
            {pages.map((p, i) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
                <Link
                  href={href(p)}
                  aria-current={p === result.page ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: p === result.page ? "default" : "outline", size: "icon" }),
                    p === result.page && "bg-royal hover:bg-royal/90",
                  )}
                >
                  {p}
                </Link>
              </span>
            ))}
            {result.page < result.totalPages && (
              <Link href={href(result.page + 1)} className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Next page">
                <ChevronRight />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
