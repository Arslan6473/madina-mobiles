import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/page-header";

export default function AdminNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Not found"
      description="This item doesn't exist or may have been deleted."
      action={
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      }
    />
  );
}
