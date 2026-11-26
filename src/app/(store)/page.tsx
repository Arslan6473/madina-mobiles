import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Headphones,
  PackageCheck,
  Quote,
  ShieldCheck,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CategoryIcon, WhatsAppIcon } from "@/components/shared/icons";
import { ProductGrid } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { RatingStars } from "@/components/store/rating-stars";
import {
  getActiveCategories,
  getBestSellers,
  getFeaturedProducts,
  getLatestProducts,
  getRecentReviews,
  getWholesaleProducts,
} from "@/services/catalog";
import { getStoreSettings } from "@/services/settings";
import { formatPrice } from "@/lib/format";
import { generalInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site";

const BRANDS = ["Apple", "Samsung", "Oppo", "Vivo", "Infinix", "Tecno", "Realme", "Mi", "Anker", "Baseus", "SanDisk", "JBL"];

export default async function HomePage() {
  const [settings, categories, bestSellers, latest, featured, wholesale, reviews] = await Promise.all([
    getStoreSettings(),
    getActiveCategories(),
    getBestSellers(8),
    getLatestProducts(8),
    getFeaturedProducts(4),
    getWholesaleProducts(4),
    getRecentReviews(6),
  ]);
  const hp = settings.homepage;
  const wa = whatsappLink(settings.whatsapp, generalInquiryMessage(settings.storeName));
  const wholesaleWa = whatsappLink(
    settings.whatsapp,
    "Assalam o Alaikum, I am a shopkeeper and would like your wholesale price list.",
  );
  const money = (n: number) => formatPrice(n, settings);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.storeName,
    description: settings.tagline,
    url: siteUrl,
    image: `${siteUrl}/brand/banner.jpg`,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressCountry: "PK",
    },
    founder: settings.ownerName,
    paymentAccepted: "Cash",
    currenciesAccepted: settings.currency,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="bg-brand-gradient relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-sky-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-orange-brand/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-yellow-brand ring-1 ring-white/20 backdrop-blur">
              <BadgeCheck className="size-4" /> Wholesale Dealer · Haroonabad
            </span>
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              {hp.heroTitle}
            </h1>
            <p className="max-w-xl text-base text-white/80 sm:text-lg">{hp.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className={buttonVariants({
                  size: "lg",
                  className: "h-12 rounded-full bg-orange-brand px-6 text-base font-semibold text-white hover:bg-orange-brand/90",
                })}
              >
                {hp.heroCtaLabel} <ArrowRight />
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: "lg",
                  className: "h-12 rounded-full bg-whatsapp px-6 text-base font-semibold text-white hover:bg-whatsapp/90",
                })}
              >
                <WhatsAppIcon /> WhatsApp Us
              </a>
            </div>
            <dl className="grid max-w-md grid-cols-3 gap-4 pt-2 text-center sm:text-left">
              {[
                ["COD", "All Pakistan"],
                ["100%", "Checked items"],
                ["Bulk", "Wholesale rates"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="text-xl font-extrabold text-yellow-brand">{k}</dt>
                  <dd className="text-xs text-white/70">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-white/30">
              <Image
                src="/brand/banner.jpg"
                alt={`${settings.storeName} — mobile accessories wholesale & retail`}
                width={1280}
                height={720}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-auto w-full rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-5 left-4 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 text-navy shadow-xl sm:flex">
              <Truck className="size-8 text-orange-brand" />
              <div className="text-sm leading-tight">
                <div className="font-bold">Cash on Delivery</div>
                <div className="text-xs text-muted-foreground">
                  {settings.freeDeliveryThreshold > 0 ? `Free delivery over ${money(settings.freeDeliveryThreshold)}` : "Delivery all over Pakistan"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12 md:py-16">
        <SectionHeading eyebrow="Browse" title="Shop by Category" href="/shop" linkLabel="All products" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:border-royal/40 hover:shadow-md sm:p-4"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-royal/10 text-royal transition group-hover:bg-royal group-hover:text-white sm:size-16">
                <CategoryIcon name={c.icon} className="size-7 sm:size-8" />
              </span>
              <span className="line-clamp-2 text-xs leading-tight font-semibold sm:text-sm">{c.name}</span>
              <span className="text-[11px] text-muted-foreground">{c.productCount ?? 0} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="container-page pb-12 md:pb-16">
          <SectionHeading eyebrow="Top picks" title="Best Sellers" href="/shop?sort=popular" />
          <ProductGrid products={bestSellers} />
        </section>
      )}

      {/* Promo banners */}
      <section className="container-page grid gap-4 pb-12 md:grid-cols-2 md:pb-16">
        <Link href="/category/power-banks" className="group relative overflow-hidden rounded-3xl bg-navy p-6 text-white sm:p-8">
          <div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-royal/60 transition group-hover:scale-110" />
          <Zap className="absolute right-8 bottom-8 size-20 text-yellow-brand/90" />
          <p className="text-xs font-bold tracking-widest text-yellow-brand uppercase">Never run out</p>
          <h3 className="mt-2 max-w-xs text-2xl font-bold">Power Banks &amp; Fast Chargers</h3>
          <p className="mt-2 max-w-xs text-sm text-white/70">Samsung, Anker, Xiaomi and more — fast charging for every phone.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-yellow-brand">
            Shop now <ArrowRight className="size-4" />
          </span>
        </Link>
        <Link href="/category/earphones-earbuds" className="group relative overflow-hidden rounded-3xl bg-orange-brand p-6 text-white sm:p-8">
          <div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-yellow-brand/40 transition group-hover:scale-110" />
          <Headphones className="absolute right-8 bottom-8 size-20 text-white/90" />
          <p className="text-xs font-bold tracking-widest text-navy-900 uppercase">Sound on</p>
          <h3 className="mt-2 max-w-xs text-2xl font-bold">Earbuds, Hands-free &amp; Speakers</h3>
          <p className="mt-2 max-w-xs text-sm text-white/85">Deep bass, clear calls, long battery — prices you&apos;ll love.</p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-navy-900">
            Shop now <ArrowRight className="size-4" />
          </span>
        </Link>
      </section>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="container-page pb-12 md:pb-16">
          <SectionHeading eyebrow="Just in" title="Latest Products" href="/shop?sort=newest" />
          <ProductGrid products={latest} />
        </section>
      )}

      {/* Wholesale */}
      <section className="bg-muted/60 py-12 md:py-16">
        <div className="container-page grid items-center gap-8 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <p className="text-xs font-bold tracking-[0.15em] text-orange-brand uppercase">For shopkeepers &amp; resellers</p>
            <h2 className="text-3xl font-bold tracking-tight text-navy">{hp.wholesaleTitle}</h2>
            <p className="text-muted-foreground">{hp.wholesaleText}</p>
            <ul className="grid gap-2 text-sm">
              {["Special rates on bulk quantities", "Fresh stock of fast-moving accessories", "Delivery to your shop all over Pakistan"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-royal" /> {t}
                </li>
              ))}
            </ul>
            <a
              href={wholesaleWa}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", className: "h-12 rounded-full bg-whatsapp px-6 text-base text-white hover:bg-whatsapp/90" })}
            >
              <WhatsAppIcon /> Get wholesale price list
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-3">
            {wholesale.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-royal/40 hover:shadow-md"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.image && <Image src={p.image.url} alt={p.name} fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-semibold">{p.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Boxes className="size-3.5 text-orange-brand" /> Bulk rates available
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <SectionHeading eyebrow="Handpicked" title="Featured Gadgets" href="/shop" />
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Brands */}
      <section className="border-y bg-card py-10">
        <div className="container-page">
          <p className="mb-6 text-center text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">Top brands we deal in</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {BRANDS.map((b) => (
              <Link
                key={b}
                href={`/shop?brand=${encodeURIComponent(b)}`}
                className="rounded-full border px-5 py-2 text-sm font-bold tracking-wide text-navy transition hover:border-royal hover:bg-royal hover:text-white"
              >
                {b}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="container-page py-12 md:py-16">
        <SectionHeading eyebrow="Why Madina" title="Why Shop With Us" align="center" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: ShieldCheck, title: "Quality checked", text: "Every item is checked before dispatch — originals and trusted brands only." },
            { Icon: Wallet, title: "Cash on Delivery", text: "No advance payment. Pay the rider when your parcel arrives." },
            { Icon: Boxes, title: "Wholesale & retail", text: "Buy one piece or a full carton — fair prices for everyone." },
            { Icon: Truck, title: "Fast nationwide delivery", text: "Quick dispatch from Haroonabad to every city in Pakistan." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 transition hover:shadow-md">
              <span className="flex size-12 items-center justify-center rounded-xl bg-orange-brand/10 text-orange-brand">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-4 font-semibold text-navy">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="container-page pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 text-white sm:p-10">
          <WhatsAppIcon className="absolute -right-6 -bottom-8 size-48 text-whatsapp/15" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Have a question? Order on WhatsApp</h2>
              <p className="mt-2 max-w-2xl text-white/70">
                Send us a message for stock availability, wholesale rates or help choosing the right accessory. {settings.ownerName} and
                team usually reply within minutes during shop hours.
              </p>
            </div>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", className: "h-12 rounded-full bg-whatsapp px-6 text-base text-white hover:bg-whatsapp/90" })}
            >
              <WhatsAppIcon /> {settings.whatsapp}
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="container-page pb-4">
          <SectionHeading eyebrow="Reviews" title="What Our Customers Say" align="center" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="flex flex-col rounded-2xl border bg-card p-6">
                <Quote className="size-6 text-orange-brand/60" />
                <RatingStars value={r.rating} className="mt-3" />
                <blockquote className="mt-3 flex-1 text-sm text-foreground/80">“{r.comment}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-navy">{r.name}</span>
                  {r.product && (
                    <Link href={`/product/${r.product.slug}`} className="block truncate text-xs text-muted-foreground hover:text-royal">
                      on {r.product.name}
                    </Link>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
