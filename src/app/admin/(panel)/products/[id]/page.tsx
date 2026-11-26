import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductByIdAdmin, listCategoriesAdmin } from "@/services/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductByIdAdmin((await params).id);
  return { title: product ? `Edit ${product.name}` : "Product not found", robots: { index: false, follow: false } };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductByIdAdmin(id), listCategoriesAdmin()]);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        title="Edit product"
        description={product.name}
        actions={
          <Link href="/admin/products" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft /> Back to products
          </Link>
        }
      />
      <ProductForm
        product={product}
        categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
        cloudinaryEnabled={isCloudinaryConfigured()}
      />
    </>
  );
}
