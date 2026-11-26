import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, StickyNote, Truck, User } from "lucide-react";
import { getOrderByIdAdmin } from "@/services/orders";
import { getStoreSettings } from "@/services/settings";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WhatsAppIcon } from "@/components/shared/icons";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { OrderNoteForm, OrderStatusForm, OrderTrackingForm, PrintInvoiceButton } from "@/components/admin/order-actions";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await getOrderByIdAdmin((await params).id);
  return { title: order ? `Order #${order.orderNumber}` : "Order not found", robots: { index: false, follow: false } };
}

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderByIdAdmin(id), getStoreSettings()]);
  if (!order) notFound();

  const money = (n: number) => formatPrice(n, settings);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const waNumber = order.customer.whatsapp || order.customer.phone;
  const waMessage =
    `Assalam o Alaikum ${order.customer.name}, this is ${settings.storeName} regarding your order #${order.orderNumber} ` +
    `(${money(order.total)}, Cash on Delivery). Current status: ${ORDER_STATUS_LABELS[order.status]}. ` +
    `Please reply to confirm your order and delivery address. JazakAllah!`;
  const address = [
    order.shippingAddress.address,
    order.shippingAddress.city,
    order.shippingAddress.province,
    order.shippingAddress.postalCode,
    order.shippingAddress.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Order <span className="font-mono">#{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} className="text-sm" />
          </span>
        }
        description={`Placed ${formatDate(order.createdAt, true)} · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        actions={
          <>
            <Link href="/admin/orders" className={buttonVariants({ variant: "ghost" })}>
              <ArrowLeft /> All orders
            </Link>
            <PrintInvoiceButton />
          </>
        }
      />

      {/* ------------------------------ Screen view ------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-3 print:hidden">
        <div className="grid content-start gap-6 lg:col-span-2">
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-semibold text-navy">Items</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => (
                  <TableRow key={`${item.productId}-${item.variantId ?? ""}-${i}`}>
                    <TableCell className="pl-4">
                      <div className="flex min-w-56 items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                        </div>
                        <div className="min-w-0 whitespace-normal">
                          <Link href={`/admin/products/${item.productId}`} className="font-medium hover:text-royal hover:underline">
                            {item.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {item.variantLabel && <span className="mr-2">{item.variantLabel}</span>}
                            <span className="font-mono">{item.sku}</span>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(item.unitPrice)}</TableCell>
                    <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="pr-4 text-right font-semibold tabular-nums">{money(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="grid gap-1.5 border-t bg-muted/20 p-4 text-sm sm:ml-auto sm:w-80">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">{order.shippingFee ? money(order.shippingFee) : "Free"}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{money(order.discount)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t pt-2 text-base font-bold text-navy">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-muted-foreground">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dt>
                <dd>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </dd>
              </div>
            </dl>
          </Card>

          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-semibold text-navy">
                  <StickyNote className="size-4" /> Customer note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rounded-lg bg-yellow-brand/10 p-3 text-sm whitespace-pre-line">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative ml-2 border-l-2 border-muted">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`} className="relative pb-5 pl-5 last:pb-0">
                    <span
                      className={cn(
                        "absolute top-1 -left-[7px] size-3 rounded-full ring-4 ring-card",
                        i === 0 ? "bg-orange-brand" : "bg-muted-foreground/40",
                      )}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={h.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(h.at, true)}</span>
                      {h.by && <span className="text-xs text-muted-foreground">· by {h.by}</span>}
                    </div>
                    {h.note && <p className="mt-1 text-sm text-foreground/80">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Internal notes</CardTitle>
              <CardDescription>Only visible to admins.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {order.internalNotes?.length ? (
                <ul className="grid gap-2">
                  {order.internalNotes.map((n, i) => (
                    <li key={`${n.at}-${i}`} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm whitespace-pre-line">{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.by} · {formatDate(n.at, true)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
              <OrderNoteForm orderId={order.id} />
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm orderId={order.id} orderNumber={order.orderNumber} current={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-semibold text-navy">Customer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <User className="size-4 text-muted-foreground" />
                {order.userId ? (
                  <Link href={`/admin/customers/${order.userId}`} className="hover:text-royal hover:underline">
                    {order.customer.name}
                  </Link>
                ) : (
                  <>
                    {order.customer.name} <span className="text-xs font-normal text-muted-foreground">(guest)</span>
                  </>
                )}
              </p>
              <a href={tel(order.customer.phone)} className="flex items-center gap-2 hover:text-royal">
                <Phone className="size-4 text-muted-foreground" /> {formatPhone(order.customer.phone)}
              </a>
              {order.customer.whatsapp && order.customer.whatsapp !== order.customer.phone && (
                <p className="flex items-center gap-2">
                  <WhatsAppIcon className="size-4 text-whatsapp" /> {formatPhone(order.customer.whatsapp)}
                </p>
              )}
              {order.customer.email && (
                <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 break-all hover:text-royal">
                  <Mail className="size-4 shrink-0 text-muted-foreground" /> {order.customer.email}
                </a>
              )}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {address}
              </p>
              <a
                href={whatsappLink(waNumber, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "mt-1 bg-whatsapp text-white hover:bg-whatsapp/90")}
              >
                <WhatsAppIcon className="size-4" /> Open WhatsApp chat
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
              <p className="text-xs text-muted-foreground">
                Opens WhatsApp with a pre-filled message to the customer. Nothing is sent until you press send in WhatsApp.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold text-navy">
                <Truck className="size-4" /> Shipment tracking
              </CardTitle>
              {order.tracking?.url && (
                <CardDescription>
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-royal underline">
                    Open tracking page
                  </a>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <OrderTrackingForm orderId={order.id} tracking={order.tracking} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------ Print invoice ----------------------------- */}
      <section className="hidden text-[12px] text-black print:block" aria-label="Invoice">
        <header className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <p className="text-2xl leading-none font-black tracking-tight text-red-brand">MADINA</p>
            <p className="text-[10px] font-bold tracking-[0.2em] text-royal">MOBILE GADGETS</p>
            <p className="mt-2 font-semibold">{settings.storeName}</p>
            <p>
              {settings.address}, {settings.city}, {settings.country}
            </p>
            <p>
              Phone: {settings.phone}
              {settings.whatsapp && settings.whatsapp !== settings.phone ? ` · WhatsApp: ${settings.whatsapp}` : ""}
            </p>
            {settings.email && <p>{settings.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">INVOICE</p>
            <p className="mt-1">
              Order <strong className="font-mono">#{order.orderNumber}</strong>
            </p>
            <p>Date: {formatDate(order.createdAt)}</p>
            <p>Payment: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <p>Status: {ORDER_STATUS_LABELS[order.status]}</p>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-wider uppercase">Bill / ship to</p>
            <p className="font-semibold">{order.customer.name}</p>
            <p>{address}</p>
            <p>Phone: {formatPhone(order.customer.phone)}</p>
            {order.customer.email && <p>{order.customer.email}</p>}
          </div>
          {order.tracking?.trackingNumber && (
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider uppercase">Shipment</p>
              {order.tracking.courier && <p>Courier: {order.tracking.courier}</p>}
              <p>Tracking #: {order.tracking.trackingNumber}</p>
            </div>
          )}
        </div>

        <table className="mt-5 w-full border-collapse">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5 pr-2">#</th>
              <th className="py-1.5 pr-2">Item</th>
              <th className="py-1.5 pr-2">SKU</th>
              <th className="py-1.5 pr-2 text-right">Unit price</th>
              <th className="py-1.5 pr-2 text-center">Qty</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={`p-${i}`} className="border-b border-gray-300 align-top">
                <td className="py-1.5 pr-2">{i + 1}</td>
                <td className="py-1.5 pr-2">
                  {item.name}
                  {item.variantLabel && <span className="text-gray-600"> ({item.variantLabel})</span>}
                </td>
                <td className="py-1.5 pr-2 font-mono">{item.sku}</td>
                <td className="py-1.5 pr-2 text-right">{money(item.unitPrice)}</td>
                <td className="py-1.5 pr-2 text-center">{item.quantity}</td>
                <td className="py-1.5 text-right">{money(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 ml-auto w-64">
          <div className="flex justify-between py-0.5">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Delivery</span>
            <span>{order.shippingFee ? money(order.shippingFee) : "Free"}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between py-0.5">
              <span>Discount</span>
              <span>−{money(order.discount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t-2 border-black pt-1 text-sm font-bold">
            <span>Total ({order.paymentStatus === "paid" ? "paid" : "cash on delivery"})</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        {order.customerNotes && (
          <p className="mt-5">
            <strong>Customer note:</strong> {order.customerNotes}
          </p>
        )}
        <p className="mt-8 border-t pt-3 text-center text-[11px] text-gray-600">
          Thank you for shopping with {settings.storeName}! For any questions call or WhatsApp {settings.whatsapp || settings.phone}.
        </p>
      </section>
    </>
  );
}
