import { requireAdminPage } from "@/lib/auth/guards";
import { getStoreSettings } from "@/services/settings";
import { getAdminNavCounts } from "@/services/admin";
import { StoreProvider } from "@/components/providers/store-provider";
import { toPublicConfig } from "@/lib/store-config";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  const [settings, counts] = await Promise.all([getStoreSettings(), getAdminNavCounts()]);
  return (
    <StoreProvider config={toPublicConfig(settings)}>
      <AdminShell counts={counts} user={{ name: user.name, email: user.email }} storeName={settings.storeName}>
        {children}
      </AdminShell>
    </StoreProvider>
  );
}
