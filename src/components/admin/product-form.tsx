"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/actions/admin";
import { productSchema, type ProductInput, type ProductParsed } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, SwitchRow } from "./field";
import { SimpleSelect } from "./simple-select";
import { ImageUploader } from "./image-uploader";
import type { ProductDTO } from "@/types";

type Category = { id: string; name: string; isActive: boolean };

const toText = (arr?: string[]) => (arr ?? []).join(", ");
const fromText = (s: string) =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

function defaults(p?: ProductDTO | null): ProductInput {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    sku: p?.sku ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    category: p?.category?.id ?? "",
    brand: p?.brand ?? "",
    tags: p?.tags ?? [],
    price: p?.price ?? "",
    salePrice: p?.salePrice ?? "",
    wholesalePrice: p?.wholesalePrice ?? "",
    wholesaleMinQty: p?.wholesaleMinQty ?? "",
    stock: p?.stock ?? 0,
    images: p?.images ?? [],
    specifications: p?.specifications ?? [],
    variants: (p?.variants ?? []).map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      attributes: v.attributes,
      price: v.price ?? "",
      salePrice: v.salePrice ?? "",
      stock: v.stock,
    })),
    isFeatured: p?.isFeatured ?? false,
    isBestSeller: p?.isBestSeller ?? false,
    isNewArrival: p?.isNewArrival ?? true,
    isPublished: p?.isPublished ?? true,
    seo: { title: p?.seo?.title ?? "", description: p?.seo?.description ?? "", keywords: p?.seo?.keywords ?? [] },
  };
}

export function ProductForm({
  product,
  categories,
  cloudinaryEnabled,
}: {
  product?: ProductDTO | null;
  categories: Category[];
  cloudinaryEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [tagsText, setTagsText] = useState(toText(product?.tags));
  const [keywordsText, setKeywordsText] = useState(toText(product?.seo?.keywords));

  const form = useForm<ProductInput, unknown, ProductParsed>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults(product),
    mode: "onTouched",
  });
  const { register, control, formState, setValue, setError } = form;
  const errors = formState.errors;

  const specs = useFieldArray({ control, name: "specifications" });
  const variants = useFieldArray({ control, name: "variants" });
  const watchedVariants = useWatch({ control, name: "variants" }) ?? [];
  const derivedStock = watchedVariants.reduce((s, v) => s + (Number(v?.stock) || 0), 0);
  const hasVariants = variants.fields.length > 0;

  const onSubmit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const res = await saveProductAction(values, product?.id);
        if (!res.ok) {
          for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
            if (v?.[0]) setError(k as keyof ProductInput, { message: v[0] });
          toast.error(res.error);
          return;
        }
        toast.success(product ? "Product updated" : "Product created");
        router.push("/admin/products");
        router.refresh();
      }),
    () => toast.error("Please fix the highlighted fields."),
  );

  const err = (m?: { message?: string }) => m?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="grid content-start gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" htmlFor="name" required error={err(errors.name)} className="sm:col-span-2">
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register("name", {
                  onChange: (e) => {
                    if (!slugTouched) setValue("slug", slugify(e.target.value));
                  },
                })}
              />
            </Field>
            <Field label="URL slug" htmlFor="slug" error={err(errors.slug)} hint="Auto-generated from the name. Must be unique.">
              <Input
                id="slug"
                aria-invalid={!!errors.slug}
                {...register("slug", { onChange: () => setSlugTouched(true) })}
              />
            </Field>
            <Field label="SKU" htmlFor="sku" required error={err(errors.sku)} hint="Letters, numbers, - or _. Saved in uppercase.">
              <Input id="sku" className="font-mono uppercase" aria-invalid={!!errors.sku} {...register("sku")} />
            </Field>
            <Field label="Brand" htmlFor="brand" required error={err(errors.brand)}>
              <Input id="brand" aria-invalid={!!errors.brand} {...register("brand")} />
            </Field>
            <Field label="Category" htmlFor="category" required error={err(errors.category)}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <SimpleSelect
                    id="category"
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={!!errors.category}
                    placeholder="Select category"
                    options={categories.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (inactive)` }))}
                  />
                )}
              />
            </Field>
            <Field
              label="Short description"
              htmlFor="shortDescription"
              error={err(errors.shortDescription)}
              hint="One or two lines shown near the price (max 300 characters)."
              className="sm:col-span-2"
            >
              <Textarea id="shortDescription" rows={2} maxLength={300} {...register("shortDescription")} />
            </Field>
            <Field label="Description" htmlFor="description" required error={err(errors.description)} className="sm:col-span-2">
              <Textarea id="description" rows={8} aria-invalid={!!errors.description} {...register("description")} />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Comma separated, e.g. fast charging, type-c, 20W" className="sm:col-span-2">
              <Input
                id="tags"
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  setValue("tags", fromText(e.target.value));
                }}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Images</CardTitle>
            <CardDescription>The first image is the main product photo. Up to 10 images.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? []}
                  onChange={field.onChange}
                  folder="products"
                  cloudinaryEnabled={cloudinaryEnabled}
                  invalid={!!errors.images}
                />
              )}
            />
            {errors.images && <p className="mt-2 text-xs font-medium text-destructive">{errors.images.message ?? "Check the images"}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Pricing &amp; stock</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" htmlFor="price" required error={err(errors.price)}>
              <Input id="price" type="number" inputMode="numeric" min={0} aria-invalid={!!errors.price} {...register("price")} />
            </Field>
            <Field label="Sale price" htmlFor="salePrice" error={err(errors.salePrice)} hint="Leave empty if not on sale.">
              <Input id="salePrice" type="number" inputMode="numeric" min={0} aria-invalid={!!errors.salePrice} {...register("salePrice")} />
            </Field>
            <Field label="Wholesale price" htmlFor="wholesalePrice" error={err(errors.wholesalePrice)} hint="Optional, per unit.">
              <Input id="wholesalePrice" type="number" inputMode="numeric" min={0} {...register("wholesalePrice")} />
            </Field>
            <Field label="Wholesale min. quantity" htmlFor="wholesaleMinQty" error={err(errors.wholesaleMinQty)}>
              <Input id="wholesaleMinQty" type="number" inputMode="numeric" min={1} {...register("wholesaleMinQty")} />
            </Field>
            <Field
              label="Stock"
              htmlFor="stock"
              error={err(errors.stock)}
              hint={hasVariants ? "Calculated from variant stock." : "Units available to sell."}
            >
              {hasVariants ? (
                <Input key="derived-stock" id="stock" value={derivedStock} disabled readOnly />
              ) : (
                <Input key="stock" id="stock" type="number" inputMode="numeric" min={0} aria-invalid={!!errors.stock} {...register("stock")} />
              )}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Variants</CardTitle>
            <CardDescription>
              Options such as colour or size. Each variant has its own stock and can override the price. Leave empty for a
              simple product.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {variants.fields.map((f, i) => (
              <VariantRow
                key={f.id}
                index={i}
                control={control}
                register={register}
                errors={errors.variants?.[i]}
                onRemove={() => variants.remove(i)}
              />
            ))}
            {errors.variants?.message && <p className="text-xs font-medium text-destructive">{errors.variants.message}</p>}
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() =>
                variants.append({ sku: "", attributes: [{ name: "Color", value: "" }], price: "", salePrice: "", stock: 0 })
              }
            >
              <Plus /> Add variant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Specifications</CardTitle>
            <CardDescription>Shown as a table on the product page, e.g. Output: 20W.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {specs.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-2">
                <div>
                  <Input
                    placeholder="Label"
                    aria-label={`Specification ${i + 1} label`}
                    aria-invalid={!!errors.specifications?.[i]?.label}
                    {...register(`specifications.${i}.label`)}
                  />
                  {errors.specifications?.[i]?.label && (
                    <p className="mt-1 text-xs text-destructive">{errors.specifications[i]?.label?.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Value"
                    aria-label={`Specification ${i + 1} value`}
                    aria-invalid={!!errors.specifications?.[i]?.value}
                    {...register(`specifications.${i}.value`)}
                  />
                  {errors.specifications?.[i]?.value && (
                    <p className="mt-1 text-xs text-destructive">{errors.specifications[i]?.value?.message}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove specification" onClick={() => specs.remove(i)}>
                  <X />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-1 w-fit" onClick={() => specs.append({ label: "", value: "" })}>
              <Plus /> Add specification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Search engine (SEO)</CardTitle>
            <CardDescription>Optional. Defaults to the product name and short description.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="SEO title" htmlFor="seo.title" error={err(errors.seo?.title)} hint="Up to 70 characters.">
              <Input id="seo.title" maxLength={70} {...register("seo.title")} />
            </Field>
            <Field label="SEO description" htmlFor="seo.description" error={err(errors.seo?.description)} hint="Up to 170 characters.">
              <Textarea id="seo.description" rows={2} maxLength={170} {...register("seo.description")} />
            </Field>
            <Field label="Keywords" htmlFor="seo.keywords" hint="Comma separated.">
              <Input
                id="seo.keywords"
                value={keywordsText}
                onChange={(e) => {
                  setKeywordsText(e.target.value);
                  setValue("seo.keywords", fromText(e.target.value));
                }}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-navy">Visibility</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(
              [
                ["isPublished", "Published", "Visible on the store"],
                ["isFeatured", "Featured", "Shown in featured sections"],
                ["isBestSeller", "Best seller", "Shows a best-seller badge"],
                ["isNewArrival", "New arrival", "Shows in new arrivals"],
              ] as const
            ).map(([name, label, desc]) => (
              <Controller
                key={name}
                control={control}
                name={name}
                render={({ field }) => (
                  <SwitchRow label={label} description={desc} control={<Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
                )}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-2">
            <Button type="submit" size="lg" disabled={pending} className="bg-navy hover:bg-navy/90">
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {product ? "Save changes" : "Create product"}
            </Button>
            <Link href="/admin/products" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Cancel
            </Link>
            {product && (
              <Link href={`/product/${product.slug}`} target="_blank" className={buttonVariants({ variant: "link", size: "sm" })}>
                View on store
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

type VariantErrors = {
  sku?: { message?: string };
  price?: { message?: string };
  salePrice?: { message?: string };
  stock?: { message?: string };
  attributes?: { message?: string; root?: { message?: string } } & Record<number, { name?: { message?: string }; value?: { message?: string } } | undefined>;
};

function VariantRow({
  index,
  control,
  register,
  errors,
  onRemove,
}: {
  index: number;
  control: Control<ProductInput, unknown, ProductParsed>;
  register: UseFormRegister<ProductInput>;
  errors?: VariantErrors;
  onRemove: () => void;
}) {
  const attrs = useFieldArray({ control, name: `variants.${index}.attributes` });
  return (
    <div className="rounded-xl border bg-muted/30 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">Variant {index + 1}</p>
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 /> Remove
        </Button>
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-medium text-muted-foreground">Attributes</p>
        {attrs.fields.map((f, j) => (
          <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
            <div>
              <Input
                placeholder="Name (e.g. Color)"
                aria-label="Attribute name"
                aria-invalid={!!errors?.attributes?.[j]?.name}
                className="bg-background"
                {...register(`variants.${index}.attributes.${j}.name`)}
              />
              {errors?.attributes?.[j]?.name && <p className="mt-1 text-xs text-destructive">{errors.attributes[j]?.name?.message}</p>}
            </div>
            <div>
              <Input
                placeholder="Value (e.g. Black)"
                aria-label="Attribute value"
                aria-invalid={!!errors?.attributes?.[j]?.value}
                className="bg-background"
                {...register(`variants.${index}.attributes.${j}.value`)}
              />
              {errors?.attributes?.[j]?.value && <p className="mt-1 text-xs text-destructive">{errors.attributes[j]?.value?.message}</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove attribute"
              disabled={attrs.fields.length <= 1}
              onClick={() => attrs.remove(j)}
            >
              <X />
            </Button>
          </div>
        ))}
        {(errors?.attributes?.message || errors?.attributes?.root?.message) && (
          <p className="text-xs text-destructive">{errors.attributes.message ?? errors.attributes.root?.message}</p>
        )}
        <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => attrs.append({ name: "", value: "" })}>
          <Plus /> Add attribute
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Stock" htmlFor={`v${index}-stock`} error={errors?.stock?.message}>
          <Input id={`v${index}-stock`} type="number" min={0} className="bg-background" {...register(`variants.${index}.stock`)} />
        </Field>
        <Field label="Price" htmlFor={`v${index}-price`} error={errors?.price?.message} hint="Optional">
          <Input id={`v${index}-price`} type="number" min={0} className="bg-background" {...register(`variants.${index}.price`)} />
        </Field>
        <Field label="Sale price" htmlFor={`v${index}-sale`} error={errors?.salePrice?.message} hint="Optional">
          <Input id={`v${index}-sale`} type="number" min={0} className="bg-background" {...register(`variants.${index}.salePrice`)} />
        </Field>
        <Field label="SKU" htmlFor={`v${index}-sku`} error={errors?.sku?.message} hint="Optional">
          <Input id={`v${index}-sku`} className="bg-background font-mono" {...register(`variants.${index}.sku`)} />
        </Field>
      </div>
    </div>
  );
}
