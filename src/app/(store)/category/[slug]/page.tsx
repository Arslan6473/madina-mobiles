import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/store/product-listing";
import { PageBreadcrumbs, PageHero } from "@/components/store/page-breadcrumbs";
import { getCategoryBySlug } from "@/services/catalog";
import { parseShopParams, type RawSearchParams } from "@/lib/shop-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const description =
    category.seo?.description ||
    category.description ||
    `Buy ${category.name} online in Pakistan at wholesale & retail prices. Cash on Delivery available.`;
  return {
    title: category.seo?.title || category.name,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: category.name,
      description,
      images: category.image?.url ? [category.image.url] : undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const shopParams = parseShopParams(await searchParams);

  return (
    <>
      <PageHero title={category.name} description={category.description}>
        <PageBreadcrumbs items={[{ name: "Shop", href: "/shop" }, { name: category.name, href: `/category/${category.slug}` }]} />
      </PageHero>
      <div className="container-page py-8">
        <ProductListing params={shopParams} basePath={`/category/${category.slug}`} category={category.slug} />
      </div>
    </>
  );
}
