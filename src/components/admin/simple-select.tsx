"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/** Thin wrapper over the Base UI Select for the common "list of string options" case. */
export function SimpleSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  disabled,
  invalid,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} aria-invalid={invalid || undefined} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
