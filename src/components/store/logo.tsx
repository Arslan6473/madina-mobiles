import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark modelled on the shop banner: red "MADINA" over blue "MOBILE GADGETS". */
export function Logo({
  logoUrl,
  storeName = "Madina Mobile Gadgets",
  className,
  inverted = false,
}: {
  logoUrl?: string;
  storeName?: string;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2", className)} aria-label={`${storeName} home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={storeName} width={160} height={48} className="h-10 w-auto object-contain" priority />
      ) : (
        <span className="flex flex-col leading-none">
          <span className={cn("text-2xl font-black tracking-tight sm:text-[1.7rem]", inverted ? "text-white" : "text-red-brand")}>
            MADINA
          </span>
          <span
            className={cn(
              "text-[10px] font-bold tracking-[0.18em] sm:text-[11px]",
              inverted ? "text-sky-200" : "text-royal",
            )}
          >
            MOBILE GADGETS
          </span>
        </span>
      )}
    </Link>
  );
}
