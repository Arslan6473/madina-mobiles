"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, ExternalLink, Loader2, Mail, Phone, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInquiryAction, setInquiryStatusAction } from "@/actions/admin";
import type { InquiryStatus } from "@/lib/constants";
import { formatDate, formatPhone } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { Button, buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import type { InquiryDTO } from "@/types";
import { ConfirmAction } from "./confirm-action";
import { InquiryStatusBadge } from "./status-badges";

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

function StatusButton({ id, to, label, icon }: { id: string; to: InquiryStatus; label: string; icon: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setInquiryStatusAction({ id, status: to });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success(`Marked as ${to}`);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {label}
    </Button>
  );
}

export function InquiryList({ inquiries, storeName }: { inquiries: InquiryDTO[]; storeName: string }) {
  return (
    <ul className="divide-y">
      {inquiries.map((inq) => (
        <li key={inq.id} className={cn("grid gap-3 p-4", inq.status === "new" && "bg-orange-brand/[0.04]")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {inq.name}
                <InquiryStatusBadge status={inq.status} />
              </p>
              {inq.subject && <p className="mt-0.5 text-sm font-medium text-navy">{inq.subject}</p>}
            </div>
            <time className="text-xs whitespace-nowrap text-muted-foreground" dateTime={inq.createdAt}>
              {formatDate(inq.createdAt, true)}
            </time>
          </div>

          <p className="rounded-lg bg-muted/50 p-3 text-sm break-words whitespace-pre-line">{inq.message}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {inq.phone && (
              <a href={tel(inq.phone)} className="flex items-center gap-1.5 hover:text-royal">
                <Phone className="size-3.5 text-muted-foreground" /> {formatPhone(inq.phone)}
              </a>
            )}
            {inq.email && (
              <a href={`mailto:${inq.email}`} className="flex items-center gap-1.5 break-all hover:text-royal">
                <Mail className="size-3.5 text-muted-foreground" /> {inq.email}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {inq.phone && (
              <a
                href={whatsappLink(
                  inq.phone,
                  `Assalam o Alaikum ${inq.name}, this is ${storeName} replying to your message${inq.subject ? ` about "${inq.subject}"` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "sm" }), "bg-whatsapp text-white hover:bg-whatsapp/90")}
              >
                <WhatsAppIcon className="size-4" /> Open WhatsApp chat <ExternalLink className="size-3 opacity-70" />
              </a>
            )}
            {inq.email && (
              <a
                href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: ${inq.subject || `Your message to ${storeName}`}`)}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <Mail /> Reply by email
              </a>
            )}
            {inq.status === "new" && <StatusButton id={inq.id} to="read" label="Mark read" icon={<Check />} />}
            {inq.status !== "resolved" && (
              <StatusButton id={inq.id} to="resolved" label="Mark resolved" icon={<CheckCheck />} />
            )}
            {inq.status === "resolved" && <StatusButton id={inq.id} to="read" label="Re-open" icon={<RotateCcw />} />}
            <ConfirmAction
              trigger={
                <Button size="sm" variant="ghost" className="ml-auto text-destructive" aria-label={`Delete message from ${inq.name}`}>
                  <Trash2 /> Delete
                </Button>
              }
              title="Delete this message?"
              description={
                <>
                  The message from <strong>{inq.name}</strong> will be permanently deleted.
                </>
              }
              action={() => deleteInquiryAction(inq.id)}
              successMessage="Message deleted"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
