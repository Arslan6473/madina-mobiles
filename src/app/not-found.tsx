import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <SearchX className="size-14 text-royal" />
      <p className="mt-4 text-sm font-semibold tracking-widest text-orange-brand uppercase">404</p>
      <h1 className="mt-1 text-3xl font-bold text-navy">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">The page or product you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg", className: "h-11 px-6" })}>
          Go home
        </Link>
        <Link href="/shop" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-6" })}>
          Browse products
        </Link>
      </div>
    </div>
  );
}
