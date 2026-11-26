import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { listCustomers } from "@/services/admin";
import { getStoreSettings } from "@/services/settings";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { SearchBox } from "@/components/admin/url-filters";
import { PaginationBar } from "@/components/admin/pagination-bar";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, settings] = await Promise.all([listCustomers({ q, page }), getStoreSettings()]);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Registered customer accounts. Guest checkouts appear only on their orders."
      />
      <Card className="gap-0 py-0">
        <div className="border-b p-3 sm:p-4">
          <SearchBox placeholder="Name, email or phone…" />
        </div>
        {result.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "No customers match your search" : "No customers yet"}
            description={q ? "Try a different name, email or phone number." : "Customers appear here once they create an account."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead className="pr-4 text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/customers/${c.id}`} className="block min-w-48 hover:text-royal">
                      <span className="block font-medium hover:underline">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.phone ? formatPhone(c.phone) : "—"}</TableCell>
                  <TableCell className="text-center tabular-nums">{c.orderCount}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatPrice(c.totalSpent, settings)}</TableCell>
                  <TableCell className="pr-4 text-right whitespace-nowrap text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <PaginationBar basePath="/admin/customers" params={{ q }} page={result.page} totalPages={result.totalPages} total={result.total} />
      </Card>
    </>
  );
}
