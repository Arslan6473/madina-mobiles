import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImageOff, MapPin, MessageCircle, Truck, Wallet } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderForViewer } from "@/services/orders";
import { getStoreSettings } from "@/services/settings";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatPhone } from "@/lib/format";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/shared/price";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { SectionCard } from "@/components/account/section-card";
import { ReorderButton } from "@/components/account/reorder-button";

type Props = { params: Promise<{ orderNumber: string }> };

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order #${safeDecode(orderNumber)}`, robots: { index: false } };
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const { orderNumber: raw } = await params;
  const orderNumber = safeDecode(raw);
  const user = await requireUserPage(`/account/orders/${encodeURIComponent(orderNumber)}`);
  const order = await getOrderForViewer(orderNumber, { user });
  // Owners only here — admins have their own order screens.
  if (!order || order.userId !== user.id) notFound();

  const settings = await getStoreSettings();
  const currency = { currency: settings.currency, currencySymbol: settings.currencySymbol };
  const waHref = whatsappLink(
    settings.whatsapp,
    orderMessage(
      {
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        items: order.items.map((i) => ({ name: i.name, variantLabel: i.variantLabel, quantity: i.quantity, unitPrice: i.unitPrice })),
        total: order.total,
        city: order.shippingAddress.city,
      },
      currency,
    ),
  );
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const { tracking } = order;
  const hasTracking = !!(tracking?.courier || tracking?.trackingNumber || tracking?.url);
  const trackingUrl = tracking?.url && /^https?:\/\//.test(tracking.url) ? tracking.url : undefined;
  const addr = order.shippingAddress;

  return (
    <div className="space-y-4 lg:space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy">
        <ArrowLeft className="size-4" /> All orders
      </Link>

      <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-navy">Order #{order.orderNumber}</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt, true)} · {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ReorderButton
              orderId={order.id}
              items={order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, name: i.name, variantLabel: i.variantLabel }))}
            />
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl border-whatsapp/40 px-5 text-green-700 hover:bg-whatsapp/10 hover:text-green-800")}
            >
              <MessageCircle /> Ask about this order
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:gap-6">
        <div className="min-w-0 space-y-4 lg:space-y-6">
          <SectionCard title="Items">
            <ul className="divide-y">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${item.variantId ?? i}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                    ) : (
                      <ImageOff className="size-5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.slug ? (
                      <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-navy hover:text-royal">
                        {item.name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium text-navy">{item.name}</p>
                    )}
                    {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Money amount={item.unitPrice} /> × {item.quantity}
                    </p>
                  </div>
                  <Money amount={item.lineTotal} className="shrink-0 text-sm font-semibold text-navy" />
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd><Money amount={order.subtotal} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{order.shippingFee > 0 ? <Money amount={order.shippingFee} /> : <span className="font-medium text-emerald-700">Free</span>}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd>− <Money amount={order.discount} /></dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-bold text-navy">
                <dt>Total</dt>
                <dd><Money amount={order.total} /></dd>
              </div>
            </dl>
          </SectionCard>

          {order.customerNotes && (
            <SectionCard title="Your notes">
              <p className="text-sm whitespace-pre-line text-muted-foreground">{order.customerNotes}</p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6">
          <SectionCard title="Order status">
            <OrderTimeline status={order.status} history={order.statusHistory} />
            {hasTracking && (
              <div className="mt-5 space-y-1.5 rounded-xl bg-muted/60 p-3.5 text-sm">
                <p className="flex items-center gap-2 font-semibold text-navy">
                  <Truck className="size-4 text-royal" /> Shipment tracking
                </p>
                {tracking?.courier && (
                  <p className="text-muted-foreground">
                    Courier: <span className="font-medium text-foreground">{tracking.courier}</span>
                  </p>
                )}
                {tracking?.trackingNumber && (
                  <p className="text-muted-foreground">
                    Tracking #: <span className="font-mono font-medium text-foreground select-all">{tracking.trackingNumber}</span>
                  </p>
                )}
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-royal hover:underline"
                  >
                    Track with courier <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Delivery address">
            <div className="flex gap-3 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-royal" />
              <address className="space-y-0.5 not-italic text-muted-foreground">
                <p className="font-medium text-foreground">{order.customer.name}</p>
                <p>{formatPhone(order.customer.phone)}</p>
                <p>{addr.address}</p>
                <p>{[addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ")}</p>
                <p>{addr.country}</p>
              </address>
            </div>
          </SectionCard>

          <SectionCard title="Payment">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Wallet className="size-4" />
              </span>
              <div>
                <p className="font-medium text-navy">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? "Cash on Delivery"}</p>
                <p className="text-xs text-muted-foreground">
                  {order.paymentStatus === "paid"
                    ? "Paid"
                    : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : order.status === "cancelled"
                        ? "No payment due"
                        : "Pay in cash when your order arrives"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
