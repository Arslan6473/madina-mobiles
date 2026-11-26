import type { Metadata } from "next";
import Link from "next/link";
import { Info, Inbox } from "lucide-react";
import { listInquiries } from "@/services/admin";
import { getStoreSettings } from "@/services/settings";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { SearchBox } from "@/components/admin/url-filters";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { InquiryList } from "@/components/admin/inquiry-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries", robots: { index: false, follow: false } };

const LABELS: Record<InquiryStatus, string> = { new: "New", read: "Read", resolved: "Resolved" };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = INQUIRY_STATUSES.includes(sp.status as InquiryStatus) ? (sp.status as InquiryStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, settings] = await Promise.all([listInquiries({ status, q, page }), getStoreSettings()]);

  const tabHref = (s?: InquiryStatus) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const qs = p.toString();
    return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  };

  return (
    <>
      <PageHeader title="Inquiries" description="Messages from the Contact page." />
      <div className="mb-4 flex gap-2 rounded-lg border border-sky-brand/30 bg-sky-brand/10 p-3 text-sm text-navy">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>Only messages submitted through the website contact form appear here. WhatsApp chats stay in WhatsApp.</p>
      </div>
      <Card className="gap-0 py-0">
        <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b px-3 pt-3 sm:px-4">
          {[undefined, ...INQUIRY_STATUSES].map((s) => {
            const active = status === s;
            return (
              <Link
                key={s ?? "all"}
                href={tabHref(s)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "border-orange-brand text-navy" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {s ? LABELS[s] : "All"}
              </Link>
            );
          })}
        </nav>
        <div className="border-b p-3 sm:p-4">
          <SearchBox placeholder="Name, phone, email or message…" />
        </div>
        {result.items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={q || status ? "No messages match" : "No messages yet"}
            description={q || status ? "Try another filter or search." : "Messages sent through the Contact page will show up here."}
          />
        ) : (
          <InquiryList inquiries={result.items} storeName={settings.storeName} />
        )}
        <PaginationBar basePath="/admin/inquiries" params={{ q, status }} page={result.page} totalPages={result.totalPages} total={result.total} />
      </Card>
    </>
  );
}
