import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ImageOff, ShoppingBag } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getUserOrders } from "@/services/orders";
import { formatDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/price";
import { OrderStatusBadge } from "@/components/shared/order-status-badge";
import { SectionCard } from "@/components/account/section-card";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

export default async function AccountOrdersPage() {
  const user = await requireUserPage("/account/orders");
  const orders = await getUserOrders(user.id);

  if (!orders.length) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-royal/10 text-royal">
            <ShoppingBag className="size-8" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-navy">No orders yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              When you place an order it will appear here so you can track it and reorder anytime.
            </p>
          </div>
          <Link href="/shop" className={cn(buttonVariants(), "h-11 rounded-xl bg-navy px-6 text-white hover:bg-navy-900")}>
            Start shopping
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="My orders" description={`${orders.length} ${orders.length === 1 ? "order" : "orders"} placed`}>
      <ul className="space-y-3">
        {orders.map((order) => {
          const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
          const thumbs = order.items.slice(0, 3);
          return (
            <li key={order.id}>
              <Link
                href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                className="group flex flex-col gap-3 rounded-2xl border p-4 transition hover:border-royal/40 hover:bg-muted/30 hover:shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex -space-x-3">
                  {thumbs.map((item, i) => (
                    <span
                      key={`${item.productId}-${item.variantId ?? i}`}
                      className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl border-2 border-card bg-muted"
                    >
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <ImageOff className="size-4 text-muted-foreground" />
                      )}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="relative flex size-12 items-center justify-center rounded-xl border-2 border-card bg-navy text-xs font-semibold text-white">
                      +{order.items.length - 3}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">#{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Placed {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Money amount={order.total} className="font-bold text-navy" />
                  <span className="flex items-center gap-1 text-sm font-medium text-royal">
                    View <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
