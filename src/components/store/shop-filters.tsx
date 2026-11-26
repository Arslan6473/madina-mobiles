"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";
import { shopQueryString, type ShopParams } from "@/lib/shop-params";
import { cn } from "@/lib/utils";

type FilterProps = {
  params: ShopParams;
  brands: string[];
  priceBounds: { min: number; max: number };
  categories?: { name: string; slug: string; productCount?: number }[];
  activeCategory?: string;
};

function FilterPanel({ params, brands, priceBounds, categories, activeCategory, onDone }: FilterProps & { onDone?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [min, setMin] = useState(params.minPrice ? String(params.minPrice) : "");
  const [max, setMax] = useState(params.maxPrice ? String(params.maxPrice) : "");

  const go = (next: Partial<ShopParams>) => {
    router.push(`${pathname}${shopQueryString({ ...params, ...next, page: 1 })}`, { scroll: false });
    onDone?.();
  };

  const toggleBrand = (brand: string, on: boolean) =>
    go({ brands: on ? [...params.brands, brand] : params.brands.filter((b) => b !== brand) });

  return (
    <div className="space-y-6">
      {categories && categories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Categories</h3>
          <ul className="grid gap-1 text-sm">
            <li>
              <Link
                href={`/shop${shopQueryString({ q: params.q, sort: params.sort })}`}
                className={cn("block rounded-lg px-2 py-1.5 hover:bg-muted", !activeCategory && "bg-royal/10 font-semibold text-royal")}
              >
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}${shopQueryString({ q: params.q, sort: params.sort })}`}
                  onClick={onDone}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted",
                    activeCategory === c.slug && "bg-royal/10 font-semibold text-royal",
                  )}
                >
                  {c.name}
                  <span className="text-xs text-muted-foreground">{c.productCount ?? ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Brands</h3>
          <div className="grid max-h-64 gap-2.5 overflow-y-auto pr-1">
            {brands.map((b) => {
              const id = `brand-${b.replace(/\W+/g, "-")}`;
              return (
                <div key={b} className="flex items-center gap-2">
                  <Checkbox id={id} checked={params.brands.includes(b)} onCheckedChange={(v) => toggleBrand(b, !!v)} />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {b}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({ minPrice: Number(min) || undefined, maxPrice: Number(max) || undefined });
        }}
      >
        <h3 className="mb-3 text-sm font-semibold text-navy">Price (Rs.)</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(priceBounds.min)}
            aria-label="Minimum price"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(priceBounds.max)}
            aria-label="Maximum price"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" className="mt-2 w-full">
          Apply price
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <Checkbox id="in-stock" checked={params.inStock} onCheckedChange={(v) => go({ inStock: !!v })} />
        <Label htmlFor="in-stock" className="cursor-pointer font-normal">
          In stock only
        </Label>
      </div>
    </div>
  );
}

export function ShopSidebar(props: FilterProps) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-36 rounded-2xl border bg-card p-5">
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

export function ShopToolbar(props: FilterProps & { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { params, total } = props;
  const activeCount = params.brands.length + (params.minPrice ? 1 : 0) + (params.maxPrice ? 1 : 0) + (params.inStock ? 1 : 0);

  const chips: { label: string; next: Partial<ShopParams> }[] = [
    ...(params.q ? [{ label: `“${params.q}”`, next: { q: undefined } }] : []),
    ...params.brands.map((b) => ({ label: b, next: { brands: params.brands.filter((x) => x !== b) } })),
    ...(params.minPrice ? [{ label: `Min Rs. ${params.minPrice}`, next: { minPrice: undefined } }] : []),
    ...(params.maxPrice ? [{ label: `Max Rs. ${params.maxPrice}`, next: { maxPrice: undefined } }] : []),
    ...(params.inStock ? [{ label: "In stock", next: { inStock: false } }] : []),
  ];

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> {total === 1 ? "product" : "products"} found
        </p>
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
              <SlidersHorizontal /> Filters{activeCount > 0 && ` (${activeCount})`}
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FilterPanel {...props} onDone={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={params.sort}
            onChange={(e) =>
              router.push(`${pathname}${shopQueryString({ ...params, sort: e.target.value as ProductSort, page: 1 })}`, { scroll: false })
            }
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {Object.entries(PRODUCT_SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.label}
              href={`${pathname}${shopQueryString({ ...params, ...c.next, page: 1 })}`}
              scroll={false}
              className="inline-flex items-center gap-1 rounded-full bg-royal/10 px-3 py-1 text-xs font-medium text-royal hover:bg-royal/20"
            >
              {c.label} <X className="size-3" />
            </Link>
          ))}
          <Link href={pathname} scroll={false} className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
