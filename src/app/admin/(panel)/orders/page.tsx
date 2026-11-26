import type { Metadata } from "next";
import Link from "next/link";
import { listOrders } from "@/services/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { DateRangeFilter, SearchBox } from "@/components/admin/url-filters";
import { OrdersTable } from "@/components/admin/orders-table";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = str("q");
  const status = ORDER_STATUSES.includes(str("status") as OrderStatus) ? (str("status") as OrderStatus) : undefined;
  const from = DATE_RX.test(str("from") ?? "") ? str("from") : undefined;
  const to = DATE_RX.test(str("to") ?? "") ? str("to") : undefined;
  const page = Math.max(1, Number(str("page")) || 1);

  const result = await listOrders({ q, status, from, to, page });

  const tabHref = (s?: OrderStatus) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (s) p.set("status", s);
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader title="Orders" description="All orders are Cash on Delivery. Confirm new orders by phone or WhatsApp before dispatch." />
      <Card className="gap-0 py-0">
        <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b px-3 pt-3 sm:px-4">
          {[undefined, ...ORDER_STATUSES].map((s) => {
            const active = status === s;
            return (
              <Link
                key={s ?? "all"}
                href={tabHref(s)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "border-orange-brand text-navy" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s ? ORDER_STATUS_LABELS[s] : "All orders"}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <SearchBox placeholder="Order #, name, phone or email…" />
          <DateRangeFilter />
        </div>
        <OrdersTable orders={result.items} />
        <PaginationBar
          basePath="/admin/orders"
          params={{ q, status, from, to }}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </Card>
    </>
  );
}
