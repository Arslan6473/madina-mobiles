import type { Metadata } from "next";
import { ProductListing } from "@/components/store/product-listing";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { parseShopParams, type RawSearchParams } from "@/lib/shop-params";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, page } = parseShopParams(await searchParams);
  return {
    title: q ? `Search: ${q}` : "Shop All Mobile Accessories",
    description:
      "Browse chargers, cables, earbuds, power banks, covers, smart watches and more at wholesale and retail prices. Cash on Delivery all over Pakistan.",
    alternates: { canonical: "/shop" },
    // Keep search and deep pages out of the index; the canonical shop page is enough.
    robots: q || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const params = parseShopParams(await searchParams);
  return (
    <>
      <PageHero
        title={params.q ? `Results for “${params.q}”` : "Shop All Products"}
        description={params.q ? undefined : "Original mobile accessories and gadgets — wholesale & retail, with Cash on Delivery."}
      >
        <PageBreadcrumbs items={[{ name: "Shop", href: "/shop" }]} />
      </PageHero>
      <div className="container-page py-8">
        <ProductListing params={params} basePath="/shop" />
      </div>
    </>
  );
}
