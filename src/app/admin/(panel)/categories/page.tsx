import type { Metadata } from "next";
import { listCategoriesAdmin } from "@/services/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories", robots: { index: false, follow: false } };

export default async function CategoriesPage() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader title="Categories" description={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`} />
      <Card className="gap-0 py-0">
        <CategoryManager categories={categories} cloudinaryEnabled={isCloudinaryConfigured()} />
      </Card>
    </>
  );
}
