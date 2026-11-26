import { Check, XCircle } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_TIMELINE, type OrderStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderDTO } from "@/types";

type History = OrderDTO["statusHistory"];

const DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: "We've received your order.",
  confirmed: "Your order has been confirmed.",
  processing: "Your items are being packed.",
  shipped: "Your parcel is on its way.",
  delivered: "Delivered — enjoy your purchase!",
  cancelled: "This order has been cancelled.",
};

/** Most recent history entry for a status (orders can move back and forth). */
function lastEntry(history: History, status: OrderStatus) {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].status === status) return history[i];
  return undefined;
}

/**
 * Vertical delivery timeline: Pending → Confirmed → Processing → Shipped → Delivered.
 * Completed steps show the date from `history`. Cancelled orders show the progress
 * reached before cancellation followed by a distinct cancelled step.
 * Server- and client-safe (no hooks).
 */
export function OrderTimeline({
  status,
  history = [],
  className,
}: {
  status: OrderStatus;
  history?: History;
  className?: string;
}) {
  const cancelled = status === "cancelled";

  // Furthest normal step reached. For cancelled orders, derive it from history.
  let reached = ORDER_TIMELINE.indexOf(status);
  if (cancelled) {
    reached = history.reduce((max, h) => Math.max(max, ORDER_TIMELINE.indexOf(h.status)), -1);
  }
  const cancelEntry = cancelled ? lastEntry(history, "cancelled") : undefined;
  // When cancelled, only show the steps actually reached (at least "pending").
  const steps = cancelled ? ORDER_TIMELINE.slice(0, Math.max(reached, 0) + 1) : ORDER_TIMELINE;

  return (
    <ol className={cn("relative space-y-0", className)} aria-label="Order progress">
      {steps.map((step, i) => {
        const done = i <= reached;
        const current = !cancelled && i === reached;
        const entry = done ? lastEntry(history, step) : undefined;
        const isLast = i === steps.length - 1 && !cancelled;
        return (
          <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 bottom-0 left-[15px] w-0.5 rounded-full",
                  done && i < reached ? (cancelled ? "bg-muted-foreground/30" : "bg-royal") : "bg-border",
                  cancelled && i === steps.length - 1 && "bg-red-brand/30",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                done
                  ? cancelled
                    ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                    : "border-royal bg-royal text-white"
                  : "border-border bg-background text-muted-foreground",
                current && "ring-4 ring-royal/15",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  done ? (cancelled ? "text-muted-foreground" : "text-navy") : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABELS[step]}
                {current && <span className="sr-only"> (current status)</span>}
              </p>
              {done ? (
                <p className="text-xs text-muted-foreground">
                  {entry ? formatDate(entry.at, true) : "Completed"}
                  {entry?.note && entry.note !== "Order placed" ? ` · ${entry.note}` : ""}
                </p>
              ) : (
                !cancelled && <p className="text-xs text-muted-foreground">{DESCRIPTIONS[step]}</p>
              )}
              {current && <p className="mt-0.5 text-xs font-medium text-royal">{DESCRIPTIONS[step]}</p>}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="relative flex gap-3">
          <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-red-brand bg-red-brand text-white ring-4 ring-red-brand/15">
            <XCircle className="size-4" />
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold text-red-brand">{ORDER_STATUS_LABELS.cancelled}</p>
            <p className="text-xs text-muted-foreground">
              {cancelEntry ? formatDate(cancelEntry.at, true) : DESCRIPTIONS.cancelled}
              {cancelEntry?.note ? ` · ${cancelEntry.note}` : ""}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
