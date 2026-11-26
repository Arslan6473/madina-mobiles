import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, Clock, Mail, Package, ShoppingBag, Trophy, Users } from "lucide-react";
import { getDashboardStats } from "@/services/admin";
import { getStoreSettings } from "@/services/settings";
import { formatPrice } from "@/lib/format";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { SalesChart } from "@/components/admin/sales-chart";
import { OrdersTable } from "@/components/admin/orders-table";
import { StockBadge } from "@/components/admin/status-badges";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone: string;
  hint?: string;
}) {
  const body = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-1.5 text-xl font-bold break-words sm:text-2xl text-navy tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone)}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function DashboardPage() {
  const [stats, settings] = await Promise.all([getDashboardStats(), getStoreSettings()]);
  const money = (n: number) => formatPrice(n, settings);
  const last30 = stats.salesSeries.reduce((s, d) => s + d.sales, 0);
  const last30Orders = stats.salesSeries.reduce((s, d) => s + d.orders, 0);

  return (
    <>
      <PageHeader title="Dashboard" description={`Overview of ${settings.storeName}. Cancelled orders are excluded from sales.`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total orders" value={String(stats.totalOrders)} icon={ShoppingBag} href="/admin/orders" tone="bg-royal/10 text-royal" />
        <StatCard label="Total sales" value={money(stats.totalSales)} icon={Banknote} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Products" value={String(stats.totalProducts)} icon={Package} href="/admin/products" tone="bg-sky-brand/15 text-sky-700" />
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          icon={Clock}
          href="/admin/orders?status=pending"
          tone="bg-orange-brand/15 text-orange-600"
          hint={stats.pendingOrders ? "Need confirmation" : "All caught up"}
        />
        <StatCard label="Customers" value={String(stats.customers)} icon={Users} href="/admin/customers" tone="bg-navy/10 text-navy" />
        <StatCard
          label="New inquiries"
          value={String(stats.newInquiries)}
          icon={Mail}
          href="/admin/inquiries?status=new"
          tone="bg-red-brand/10 text-red-brand"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Sales · last 30 days</CardTitle>
            <CardDescription>
              {money(last30)} from {last30Orders} order{last30Orders === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats.salesSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold text-navy">
              <Trophy className="size-4 text-yellow-brand" /> Top products
            </CardTitle>
            <CardDescription>By units sold</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length ? (
              <ol className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-navy">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-royal hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.quantity} sold · {money(p.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No sales yet" className="py-8" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="gap-0 pb-0 xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-semibold text-navy">Recent orders</CardTitle>
            <CardAction>
              <Link href="/admin/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <OrdersTable orders={stats.recentOrders} compact />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold text-navy">
              <AlertTriangle className="size-4 text-orange-brand" /> Low stock
            </CardTitle>
            <CardDescription>Products (or a variant) at 5 or fewer units</CardDescription>
            <CardAction>
              <Link href="/admin/products?status=low-stock" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                All <ArrowRight />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length ? (
              <ul className="divide-y">
                {stats.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-royal hover:underline">
                        {p.name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                    </div>
                    <StockBadge stock={p.stock} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Stock levels look healthy" className="py-8" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
