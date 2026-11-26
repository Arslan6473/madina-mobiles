import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toNumber = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};

/** Parses shop URL params (`?q=&brand=a,b&min=&max=&stock=1&sort=&page=`) into a catalog query. */
export function parseShopParams(sp: RawSearchParams) {
  const sort = first(sp.sort);
  const brandValues = ([] as string[]).concat(sp.brand ?? []).flatMap((b) => b.split(","));
  return {
    q: first(sp.q)?.trim().slice(0, 100) || undefined,
    brands: [...new Set(brandValues.map((b) => b.trim()).filter(Boolean))].slice(0, 20),
    minPrice: toNumber(first(sp.min)),
    maxPrice: toNumber(first(sp.max)),
    inStock: first(sp.stock) === "1",
    sort: (sort && sort in PRODUCT_SORTS ? sort : "newest") as ProductSort,
    page: toNumber(first(sp.page)) ?? 1,
  };
}

export type ShopParams = ReturnType<typeof parseShopParams>;

/** Builds a query string from shop params, dropping defaults. */
export function shopQueryString(p: Partial<ShopParams>) {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.brands?.length) qs.set("brand", p.brands.join(","));
  if (p.minPrice) qs.set("min", String(p.minPrice));
  if (p.maxPrice) qs.set("max", String(p.maxPrice));
  if (p.inStock) qs.set("stock", "1");
  if (p.sort && p.sort !== "newest") qs.set("sort", p.sort);
  if (p.page && p.page > 1) qs.set("page", String(p.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
