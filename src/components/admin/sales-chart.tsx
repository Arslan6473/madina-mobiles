"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useMoney } from "@/components/providers/store-provider";

const config = {
  sales: { label: "Sales", color: "var(--brand-royal)" },
  orders: { label: "Orders", color: "var(--brand-orange)" },
} satisfies ChartConfig;

const shortDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short" });

export function SalesChart({ data }: { data: { date: string; sales: number; orders: number }[] }) {
  const money = useMoney();
  const compact = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={shortDate} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compact} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) => {
                const d = payload?.[0]?.payload?.date as string | undefined;
                return d ? shortDate(d) : "";
              }}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: item.color }} />
                    {name === "sales" ? "Sales" : "Orders"}
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {name === "sales" ? money(Number(value)) : String(value)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area dataKey="sales" type="monotone" fill="url(#fillSales)" stroke="var(--color-sales)" strokeWidth={2} />
        <Area dataKey="orders" type="monotone" fill="transparent" stroke="var(--color-orders)" strokeWidth={0} activeDot={false} />
      </AreaChart>
    </ChartContainer>
  );
}
