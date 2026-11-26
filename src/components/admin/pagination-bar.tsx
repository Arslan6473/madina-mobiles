import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Server-rendered prev/next pagination that preserves the current filters. */
export function PaginationBar({
  basePath,
  params,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return <p className="px-4 py-3 text-xs text-muted-foreground">{total} result{total === 1 ? "" : "s"}</p>;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const btn = buttonVariants({ variant: "outline", size: "sm" });
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total} results
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btn}>
            <ChevronLeft /> Previous
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-50")}>
            <ChevronLeft /> Previous
          </span>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={btn}>
            Next <ChevronRight />
          </Link>
        ) : (
          <span className={cn(btn, "pointer-events-none opacity-50")}>
            Next <ChevronRight />
          </span>
        )}
      </div>
    </div>
  );
}
