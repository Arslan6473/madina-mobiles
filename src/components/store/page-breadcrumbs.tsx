import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

export type Crumb = { name: string; href?: string };

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD. */
export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={`${c.name}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="flex items-center gap-1 hover:text-royal">
                {i === 0 && <Home className="size-3.5" />}
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/50">
      <div className="container-page space-y-3 py-6 md:py-8">
        {children}
        <h1 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
    </div>
  );
}
