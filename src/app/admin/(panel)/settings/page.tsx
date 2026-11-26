import type { Metadata } from "next";
import { getStoreSettings } from "@/services/settings";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader title="Store settings" description="Changes apply to the storefront as soon as you save." />
      <SettingsForm settings={settings} cloudinaryEnabled={isCloudinaryConfigured()} />
    </>
  );
}
