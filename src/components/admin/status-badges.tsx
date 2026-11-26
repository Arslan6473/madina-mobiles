import { ORDER_STATUS_LABELS, type InquiryStatus, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-brand/20 text-amber-800 ring-amber-300/60",
  confirmed: "bg-sky-brand/15 text-sky-800 ring-sky-300/60",
  processing: "bg-royal/10 text-royal ring-royal/25",
  shipped: "bg-orange-brand/15 text-orange-700 ring-orange-300/60",
  delivered: "bg-emerald-100 text-emerald-800 ring-emerald-300/60",
  cancelled: "bg-red-brand/10 text-red-brand ring-red-brand/25",
};

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn(pill, ORDER_STATUS_STYLES[status], className)}>{ORDER_STATUS_LABELS[status]}</span>;
}

const INQUIRY_STYLES: Record<InquiryStatus, string> = {
  new: "bg-orange-brand/15 text-orange-700 ring-orange-300/60",
  read: "bg-sky-brand/15 text-sky-800 ring-sky-300/60",
  resolved: "bg-emerald-100 text-emerald-800 ring-emerald-300/60",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return <span className={cn(pill, INQUIRY_STYLES[status], "capitalize")}>{status}</span>;
}

export function PaymentStatusBadge({ status }: { status: "unpaid" | "paid" | "refunded" }) {
  const styles = {
    unpaid: "bg-muted text-muted-foreground ring-border",
    paid: "bg-emerald-100 text-emerald-800 ring-emerald-300/60",
    refunded: "bg-red-brand/10 text-red-brand ring-red-brand/25",
  } as const;
  return <span className={cn(pill, styles[status], "capitalize")}>{status}</span>;
}

export function StockBadge({ stock, low = 5 }: { stock: number; low?: number }) {
  if (stock <= 0) return <span className={cn(pill, "bg-red-brand/10 text-red-brand ring-red-brand/25")}>Out of stock</span>;
  if (stock <= low) return <span className={cn(pill, "bg-yellow-brand/20 text-amber-800 ring-amber-300/60")}>Low · {stock}</span>;
  return <span className={cn(pill, "bg-emerald-100 text-emerald-800 ring-emerald-300/60")}>{stock} in stock</span>;
}
