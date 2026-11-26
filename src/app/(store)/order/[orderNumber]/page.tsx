import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Package, Phone, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { getOrderForViewer } from "@/services/orders";
import { getStoreSettings } from "@/services/settings";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatDate, formatPrice } from "@/lib/format";
import { orderMessage, whatsappLink } from "@/lib/whatsapp";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Order Details", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string; placed?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ orderNumber }, { token, placed }] = await Promise.all([params, searchParams]);
  const [user, settings] = await Promise.all([getCurrentUser(), getStoreSettings()]);
  const order = await getOrderForViewer(decodeURIComponent(orderNumber).toUpperCase(), { user, token });
  if (!order) notFound();

  const money = (n: number) => formatPrice(n, settings);
  const justPlaced = placed === "1";
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
      settings,
    ),
  );

  return (
    <div className="container-page max-w-5xl py-8 md:py-12">
      {justPlaced ? (
        <div className="mb-8 rounded-3xl bg-brand-gradient p-6 text-center text-white sm:p-10">
          <CheckCircle2 className="mx-auto size-14 text-yellow-brand" />
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Thank you! Your order has been placed.</h1>
          <p className="mt-2 text-white/80">
            Your order number is <span className="font-mono text-lg font-bold text-yellow-brand">{order.orderNumber}</span>
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/75">
            Our team will call you on <strong>{order.customer.phone}</strong> to confirm. For a faster confirmation you can also
            message us on WhatsApp — tapping the button opens WhatsApp with your order details ready to send.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", className: "h-12 rounded-full bg-whatsapp px-6 text-base text-white hover:bg-whatsapp/90" })}
            >
              <WhatsAppIcon /> Confirm on WhatsApp
            </a>
            <Link
              href="/shop"
              className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 rounded-full border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white" })}
            >
              Continue shopping
            </Link>
          </div>
          {!user && (
            <p className="mt-5 text-xs text-white/60">
              Save this page link or note your order number — you can track it any time on the{" "}
              <Link href="/track-order" className="underline">
                Track Order
              </Link>{" "}
              page with your phone number.
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt, true)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-navy">
              <Truck className="size-5 text-royal" /> Order status
            </h2>
            <OrderTimeline status={order.status} history={order.statusHistory} />
            {order.tracking?.trackingNumber && (
              <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
                {order.tracking.courier && <span className="font-semibold">{order.tracking.courier}: </span>}
                Tracking # <span className="font-mono">{order.tracking.trackingNumber}</span>
                {order.tracking.url && (
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-royal hover:underline">
                    Track parcel
                  </a>
                )}
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 font-semibold text-navy">
              <Package className="size-5 text-royal" /> Items
            </h2>
            <ul className="divide-y">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-3 py-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 font-medium hover:text-royal">
                      {item.name}
                    </Link>
                    {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {money(item.unitPrice)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{money(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{order.shippingFee === 0 ? "Free" : money(order.shippingFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd>-{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="text-navy">{money(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
            <h2 className="flex items-center gap-2 font-semibold text-navy">
              <MapPin className="size-5 text-royal" /> Delivery to
            </h2>
            <div>
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.address}, {order.shippingAddress.city}
                {order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ""}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3.5" /> {order.customer.phone}
              </p>
            </div>
            <div className="border-t pt-3">
              <p className="text-muted-foreground">Payment</p>
              <p className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            </div>
            {order.customerNotes && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground">Your notes</p>
                <p>{order.customerNotes}</p>
              </div>
            )}
          </section>
          <section className="rounded-2xl border bg-card p-5 text-sm">
            <p className="font-semibold text-navy">Need help with this order?</p>
            <p className="mt-1 text-muted-foreground">Message us on WhatsApp with your order number.</p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: "mt-3 h-10 w-full bg-whatsapp text-white hover:bg-whatsapp/90" })}
            >
              <WhatsAppIcon /> {settings.whatsapp}
            </a>
            {user && (
              <Link href="/account/orders" className="mt-3 block text-center text-sm font-medium text-royal hover:underline">
                View all my orders
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
