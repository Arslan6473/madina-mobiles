import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
