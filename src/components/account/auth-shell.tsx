import { ShieldCheck, Truck, Wallet } from "lucide-react";

/** Centered card layout shared by the login / register / password-reset pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-muted/40">
      <div aria-hidden className="bg-brand-gradient absolute inset-x-0 top-0 h-48 sm:h-56" />
      <div className="container-page relative flex justify-center py-8 sm:py-14">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-navy/5 sm:p-8">
            <div className="mb-6 space-y-1.5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
          <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground sm:text-xs">
            <li className="flex flex-col items-center gap-1">
              <Wallet className="size-4 text-royal" /> Cash on Delivery
            </li>
            <li className="flex flex-col items-center gap-1">
              <Truck className="size-4 text-royal" /> Delivery across Pakistan
            </li>
            <li className="flex flex-col items-center gap-1">
              <ShieldCheck className="size-4 text-royal" /> Secure account
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
