"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        autoFocus={autoFocus}
        defaultValue={params.get("q") ?? ""}
        placeholder="Search chargers, earbuds, power banks…"
        className="h-11 w-full rounded-full border border-input bg-muted/60 pr-12 pl-4 text-sm outline-none transition focus:border-royal focus:bg-background focus:ring-3 focus:ring-royal/15"
        maxLength={80}
      />
      <button
        type="submit"
        className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-royal text-white transition hover:bg-navy"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
