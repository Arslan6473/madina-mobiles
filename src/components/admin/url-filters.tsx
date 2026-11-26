"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleSelect, type SelectOption } from "./simple-select";
import { cn } from "@/lib/utils";

const ALL = "__all";

/** Updates URL search params (resetting pagination) inside a transition. */
function useParamSetter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { set, pending, searchParams };
}

export function SearchBox({ placeholder = "Search…", param = "q", className }: { placeholder?: string; param?: string; className?: string }) {
  const { set, pending, searchParams } = useParamSetter();
  const current = searchParams.get(param) ?? "";
  const [value, setValue] = useState(current);
  const [prev, setPrev] = useState(current);
  if (prev !== current) {
    setPrev(current);
    setValue(current);
  }

  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => set({ [param]: value.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pr-8 pl-8"
      />
      {pending && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}

export function ParamSelect({
  param,
  options,
  allLabel = "All",
  className,
  label,
}: {
  param: string;
  options: SelectOption[];
  allLabel?: string;
  className?: string;
  label: string;
}) {
  const { set, searchParams } = useParamSetter();
  const value = searchParams.get(param) ?? ALL;
  return (
    <SimpleSelect
      aria-label={label}
      value={value}
      onValueChange={(v) => set({ [param]: v === ALL ? undefined : v })}
      options={[{ value: ALL, label: allLabel }, ...options]}
      className={cn("h-9 sm:w-44", className)}
    />
  );
}

export function DateRangeFilter() {
  const { set, searchParams } = useParamSetter();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        aria-label="From date"
        value={from}
        max={to || undefined}
        onChange={(e) => set({ from: e.target.value || undefined })}
        className="h-9 w-[9.5rem]"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="To date"
        value={to}
        min={from || undefined}
        onChange={(e) => set({ to: e.target.value || undefined })}
        className="h-9 w-[9.5rem]"
      />
      {(from || to) && (
        <Button variant="ghost" size="icon-sm" aria-label="Clear dates" onClick={() => set({ from: undefined, to: undefined })}>
          <X />
        </Button>
      )}
    </div>
  );
}
