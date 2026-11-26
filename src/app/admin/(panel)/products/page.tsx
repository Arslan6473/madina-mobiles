import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listCategoriesAdmin, listProductsAdmin } from "@/services/admin";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { ParamSelect, SearchBox } from "@/components/admin/url-filters";
import { ProductsTable } from "@/components/admin/products-table";
import { PaginationBar } from "@/components/admin/pagination-bar";

export const metadata: Metadata = { title: "Products", robots: { index: false, follow: false } };

const STATUSES = ["published", "draft", "low-stock"] as const;
type Status = (typeof STATUSES)[number];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = str("q");
  const category = str("category");
  const status = STATUSES.includes(str("status") as Status) ? (str("status") as Status) : undefined;
  const page = Math.max(1, Number(str("page")) || 1);

  const [result, categories] = await Promise.all([listProductsAdmin({ q, category, status, page }), listCategoriesAdmin()]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${result.total} product${result.total === 1 ? "" : "s"}${q || category || status ? " match your filters" : " in the catalogue"}`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ className: "bg-navy hover:bg-navy/90" })}>
            <Plus /> Add product
          </Link>
        }
      />
      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
          <SearchBox placeholder="Search name, SKU or brand…" />
          <ParamSelect
            param="category"
            label="Category"
            allLabel="All categories"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <ParamSelect
            param="status"
            label="Status"
            allLabel="Any status"
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft (hidden)" },
              { value: "low-stock", label: "Low / out of stock" },
            ]}
          />
        </div>
        <ProductsTable products={result.items} />
        <PaginationBar
          basePath="/admin/products"
          params={{ q, category, status }}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </Card>
    </>
  );
}
