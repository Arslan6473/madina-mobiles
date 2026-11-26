import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import { getCustomerAdmin } from "@/services/admin";
import { listOrders } from "@/services/orders";
import { getStoreSettings } from "@/services/settings";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/shared/icons";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getCustomerAdmin((await params).id);
  return { title: user ? user.name : "Customer not found", robots: { index: false, follow: false } };
}

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export default async function CustomerDetailPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const [user, settings] = await Promise.all([getCustomerAdmin(id), getStoreSettings()]);
  if (!user || user.role !== "customer") notFound();
  const orders = await listOrders({ userId: user.id, page });
  const spent = orders.items.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const phone = user.phone ?? user.addresses.find((a) => a.isDefault)?.phone ?? user.addresses[0]?.phone;

  return (
    <>
      <PageHeader
        title={user.name}
        description={`Customer since ${formatDate(user.createdAt)}`}
        actions={
          <Link href="/admin/customers" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft /> All customers
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <a href={`mailto:${user.email}`} className="flex items-center gap-2 break-all hover:text-royal">
                <Mail className="size-4 shrink-0 text-muted-foreground" /> {user.email}
              </a>
              {phone ? (
                <>
                  <a href={tel(phone)} className="flex items-center gap-2 hover:text-royal">
                    <Phone className="size-4 text-muted-foreground" /> {formatPhone(phone)}
                  </a>
                  <a
                    href={whatsappLink(phone, `Assalam o Alaikum ${user.name}, this is ${settings.storeName}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }), "mt-1 w-fit border-whatsapp/40 text-whatsapp hover:bg-whatsapp/10")}
                  >
                    <WhatsAppIcon className="size-4" /> Open WhatsApp chat
                  </a>
                </>
              ) : (
                <p className="text-muted-foreground">No phone number on file.</p>
              )}
              <dl className="mt-2 grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Orders</dt>
                  <dd className="text-lg font-bold text-navy tabular-nums">{orders.total}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Spent{orders.totalPages > 1 ? " (this page)" : ""}</dt>
                  <dd className="text-lg font-bold text-navy tabular-nums">{formatPrice(spent, settings)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Saved addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {user.addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses.</p>
              ) : (
                <ul className="grid gap-3">
                  {user.addresses.map((a) => (
                    <li key={a.id} className="rounded-lg border p-3 text-sm">
                      <p className="flex items-center gap-2 font-medium">
                        <MapPin className="size-4 text-muted-foreground" /> {a.label}
                        {a.isDefault && (
                          <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold text-navy">Default</span>
                        )}
                      </p>
                      <p className="mt-1">{a.fullName} · {formatPhone(a.phone)}</p>
                      <p className="text-muted-foreground">
                        {[a.address, a.city, a.province, a.postalCode, a.country].filter(Boolean).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="gap-0 py-0 lg:col-span-2">
          <CardHeader className="py-4">
            <CardTitle className="font-semibold text-navy">Orders</CardTitle>
          </CardHeader>
          {orders.items.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" description="This customer hasn't placed an order." />
          ) : (
            <>
              <OrdersTable orders={orders.items} />
              <PaginationBar
                basePath={`/admin/customers/${user.id}`}
                params={{}}
                page={orders.page}
                totalPages={orders.totalPages}
                total={orders.total}
              />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
