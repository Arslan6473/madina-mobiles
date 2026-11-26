import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", align === "center" && "flex-col items-center text-center", className)}>
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.15em] text-orange-brand uppercase">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-royal hover:text-navy">
          {linkLabel}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
