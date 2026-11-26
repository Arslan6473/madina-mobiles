import { CheckCircle2, Clock, PackageCheck, Truck, XCircle, Cog } from "lucide-react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, { className: string; Icon: typeof Clock }> = {
  pending: { className: "bg-yellow-brand/15 text-amber-800 ring-yellow-brand/40", Icon: Clock },
  confirmed: { className: "bg-sky-brand/10 text-sky-800 ring-sky-brand/30", Icon: CheckCircle2 },
  processing: { className: "bg-royal/10 text-royal ring-royal/25", Icon: Cog },
  shipped: { className: "bg-orange-brand/10 text-orange-700 ring-orange-brand/30", Icon: Truck },
  delivered: { className: "bg-emerald-50 text-emerald-700 ring-emerald-600/25", Icon: PackageCheck },
  cancelled: { className: "bg-red-brand/10 text-red-brand ring-red-brand/25", Icon: XCircle },
};

/** Coloured pill showing an order's status. Server- and client-safe. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { className: tone, Icon } = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
