import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, RotateCcw, Truck, Wallet } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ReviewForm } from "@/components/product/review-form";
import { PageBreadcrumbs } from "@/components/store/page-breadcrumbs";
import { ProductGrid } from "@/components/store/product-card";
import { RatingStars } from "@/components/store/rating-stars";
import { SectionHeading } from "@/components/store/section-heading";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/services/catalog";
import { getStoreSettings } from "@/services/settings";
import { getCurrentUser } from "@/lib/auth/guards";
import { discountPercent, formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description =
    product.seo?.description ||
    product.shortDescription ||
    `Buy ${product.name} online in Pakistan. Cash on Delivery available. Wholesale & retail.`;
  return {
    title: product.seo?.title || product.name,
    description,
    keywords: product.seo?.keywords?.length ? product.seo.keywords : product.tags,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/product/${product.slug}`,
      images: product.images.slice(0, 4).map((i) => ({ url: i.url, alt: i.alt || product.name })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, settings, user] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.category?.id, 4),
    getStoreSettings(),
    getCurrentUser(),
  ]);

  const totalStock = product.variants.length ? product.variants.reduce((n, v) => n + v.stock, 0) : product.stock;
  const discount = discountPercent(product.price, product.salePrice);
  const prices = product.variants.length
    ? product.variants.map((v) => v.salePrice ?? v.price ?? product.salePrice ?? product.price)
    : [product.salePrice && product.salePrice < product.price ? product.salePrice : product.price];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription || product.description.slice(0, 300),
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : absoluteUrl(i.url))),
    brand: { "@type": "Brand", name: product.brand },
    category: product.category?.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: settings.currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: Math.max(1, product.variants.length),
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/product/${product.slug}`),
      seller: { "@type": "Organization", name: settings.storeName },
    },
    ...(product.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount } }
      : {}),
    ...(reviews.length
      ? {
          review: reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.comment,
            datePublished: r.createdAt,
          })),
        }
      : {}),
  };

  return (
    <div className="container-page py-6 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageBreadcrumbs
        items={[
          { name: "Shop", href: "/shop" },
          ...(product.category ? [{ name: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { name: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={product.images}
          name={product.name}
          badge={
            <>
              {discount > 0 && <span className="rounded-full bg-red-brand px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span>}
              {product.isNewArrival && <span className="rounded-full bg-royal px-2.5 py-1 text-xs font-bold text-white">New</span>}
              {product.isBestSeller && (
                <span className="rounded-full bg-yellow-brand px-2.5 py-1 text-xs font-bold text-navy-900">Best Seller</span>
              )}
            </>
          }
        />

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/shop?brand=${encodeURIComponent(product.brand)}`} className="font-semibold text-royal hover:underline">
                {product.brand}
              </Link>
              <span className="text-muted-foreground">· SKU {product.sku}</span>
            </div>
            <h1 className="text-2xl leading-tight font-bold text-navy md:text-3xl">{product.name}</h1>
            {product.ratingCount > 0 && (
              <a href="#reviews" className="inline-flex">
                <RatingStars value={product.ratingAvg} count={product.ratingCount} />
              </a>
            )}
            {product.shortDescription && <p className="text-muted-foreground">{product.shortDescription}</p>}
          </div>

          <ProductPurchase
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              salePrice: product.salePrice,
              stock: product.stock,
              variants: product.variants,
              images: product.images,
              wholesalePrice: product.wholesalePrice,
              wholesaleMinQty: product.wholesaleMinQty,
            }}
          />

          <ul className="grid gap-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Wallet className="size-4 text-royal" /> Cash on Delivery
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-royal" />
              {settings.freeDeliveryThreshold > 0
                ? `Free delivery over ${settings.currencySymbol} ${settings.freeDeliveryThreshold.toLocaleString("en-PK")}`
                : "Delivery all over Pakistan"}
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-royal" /> Quality checked before dispatch
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="size-4 text-royal" /> Easy exchange for faulty items
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="mb-3 text-xl font-bold text-navy">
            Description
          </h2>
          <div className="leading-relaxed whitespace-pre-line text-foreground/85">{product.description}</div>
        </section>
        {product.specifications.length > 0 && (
          <section aria-labelledby="spec-heading">
            <h2 id="spec-heading" className="mb-3 text-xl font-bold text-navy">
              Specifications
            </h2>
            <dl className="overflow-hidden rounded-2xl border text-sm">
              {product.specifications.map((s, i) => (
                <div key={s.label + i} className="grid grid-cols-5 gap-2 px-4 py-2.5 odd:bg-muted/50">
                  <dt className="col-span-2 font-medium text-muted-foreground">{s.label}</dt>
                  <dd className="col-span-3">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <section id="reviews" className="mt-12 scroll-mt-32" aria-labelledby="reviews-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 id="reviews-heading" className="text-xl font-bold text-navy">
            Customer Reviews
          </h2>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{product.ratingAvg.toFixed(1)}</span>
              <RatingStars value={product.ratingAvg} count={product.ratingCount} />
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{r.name}</span>
                    <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>
                      {formatDate(r.createdAt)}
                    </time>
                  </div>
                  <RatingStars value={r.rating} size="sm" className="mt-1" />
                  <p className="mt-2 text-sm text-foreground/85">{r.comment}</p>
                </article>
              ))
            )}
          </div>
          <ReviewForm productId={product.id} productSlug={product.slug} signedIn={!!user} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="You may also like"
            href={product.category ? `/category/${product.category.slug}` : "/shop"}
            linkLabel="More in this category"
          />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
