import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategoriesAdmin } from "@/services/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product", robots: { index: false, follow: false } };

export default async function NewProductPage() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader
        title="New product"
        description="Add a product to your catalogue."
        actions={
          <Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft /> Back to products
          </Link>
        }
      />
      {categories.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-sm">
          Create a category first.{" "}
          <Link href="/admin/categories" className="font-medium text-royal underline">
            Go to categories
          </Link>
        </p>
      ) : (
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
          cloudinaryEnabled={isCloudinaryConfigured()}
        />
      )}
    </>
  );
}
