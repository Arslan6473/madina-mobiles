"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/shared/price";
import { formatDate } from "@/lib/format";
import type { OrderDTO } from "@/types";
import { OrderStatusBadge } from "./status-badges";
import { EmptyState } from "./page-header";

export function OrdersTable({ orders, compact = false }: { orders: OrderDTO[]; compact?: boolean }) {
  if (!orders.length) return <EmptyState title="No orders found" description="Orders placed on the store will show up here." />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead className="pl-4">Order</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          {!compact && <TableHead>City</TableHead>}
          {!compact && <TableHead className="text-center">Items</TableHead>}
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="pr-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id} className="relative">
            <TableCell className="pl-4 font-mono text-xs font-semibold">
              <Link href={`/admin/orders/${o.id}`} className="text-royal after:absolute after:inset-0 hover:underline">
                {o.orderNumber}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(o.createdAt, !compact)}</TableCell>
            <TableCell>
              <div className="font-medium">{o.customer.name}</div>
              {!compact && <div className="text-xs text-muted-foreground">{o.customer.phone}</div>}
            </TableCell>
            {!compact && <TableCell>{o.shippingAddress.city}</TableCell>}
            {!compact && <TableCell className="text-center">{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>}
            <TableCell className="text-right font-semibold tabular-nums">
              <Money amount={o.total} />
            </TableCell>
            <TableCell className="pr-4">
              <OrderStatusBadge status={o.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
