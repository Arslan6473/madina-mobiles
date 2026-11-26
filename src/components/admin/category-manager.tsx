"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategoryAction, saveCategoryAction, toggleCategoryActiveAction } from "@/actions/admin";
import { categorySchema, type CategoryInput } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types";
import type { z } from "zod";
import { ConfirmAction } from "./confirm-action";
import { Field, SwitchRow } from "./field";
import { ImageUploader } from "./image-uploader";
import { EmptyState } from "./page-header";

type CategoryParsed = z.output<typeof categorySchema>;

function ActiveSwitch({ category }: { category: CategoryDTO }) {
  const [pending, startTransition] = useTransition();
  const [value, setOptimistic] = useOptimistic(category.isActive);
  return (
    <Switch
      aria-label={`Active: ${category.name}`}
      checked={value}
      disabled={pending}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          setOptimistic(checked);
          const res = await toggleCategoryActiveAction(category.id, checked);
          if (!res.ok) toast.error(res.error);
          else toast.success(checked ? `${category.name} is now visible` : `${category.name} hidden from store`);
        })
      }
    />
  );
}

export function CategoryManager({ categories, cloudinaryEnabled }: { categories: CategoryDTO[]; cloudinaryEnabled: boolean }) {
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [open, setOpen] = useState(false);
  const nextSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1;

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: CategoryDTO) => {
    setEditing(c);
    setOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b p-3 sm:p-4">
        <p className="text-sm text-muted-foreground">
          Lower sort order appears first. Inactive categories are hidden from the store.
        </p>
        <Button onClick={openNew} className="bg-navy hover:bg-navy/90">
          <Plus /> Add category
        </Button>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet" description="Create categories to organise your products." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Category</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">Sort</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-4">
                  <div className="flex min-w-52 items-center gap-3">
                    <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy/5 text-navy">
                      {c.image ? (
                        <Image src={c.image.url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <CategoryIcon name={c.icon} className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{c.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">/{c.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{c.productCount ?? 0}</TableCell>
                <TableCell className="text-center tabular-nums">{c.sortOrder}</TableCell>
                <TableCell className="text-center">
                  <ActiveSwitch category={c} />
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
                      <Pencil />
                    </Button>
                    <ConfirmAction
                      trigger={
                        <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Delete ${c.name}`}>
                          <Trash2 />
                        </Button>
                      }
                      title="Delete this category?"
                      description={
                        (c.productCount ?? 0) > 0 ? (
                          <>
                            <strong>{c.name}</strong> still has {c.productCount} product(s). Deleting will be blocked until
                            they are moved or deleted — you can disable the category instead.
                          </>
                        ) : (
                          <>
                            <strong>{c.name}</strong> will be permanently deleted.
                          </>
                        )
                      }
                      action={() => deleteCategoryAction(c.id)}
                      successMessage="Category deleted"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-navy">{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Categories appear in the store menu and on the homepage.</DialogDescription>
          </DialogHeader>
          {open && (
            <CategoryForm
              key={editing?.id ?? "new"}
              category={editing}
              defaultSort={nextSort}
              cloudinaryEnabled={cloudinaryEnabled}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({
  category,
  defaultSort,
  cloudinaryEnabled,
  onDone,
}: {
  category: CategoryDTO | null;
  defaultSort: number;
  cloudinaryEnabled: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(!!category);
  const form = useForm<CategoryInput, unknown, CategoryParsed>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      icon: category?.icon ?? "package",
      image: category?.image ?? null,
      sortOrder: category?.sortOrder ?? defaultSort,
      isActive: category?.isActive ?? true,
      seo: { title: category?.seo?.title ?? "", description: category?.seo?.description ?? "" },
    },
  });
  const { register, control, setValue, setError, formState } = form;
  const errors = formState.errors;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await saveCategoryAction(values, category?.id);
      if (!res.ok) {
        for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
          if (v?.[0]) setError(k as keyof CategoryInput, { message: v[0] });
        toast.error(res.error);
        return;
      }
      toast.success(category ? "Category updated" : "Category created");
      onDone();
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="cat-name" required error={errors.name?.message}>
          <Input
            id="cat-name"
            aria-invalid={!!errors.name}
            {...register("name", { onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value)) })}
          />
        </Field>
        <Field label="Slug" htmlFor="cat-slug" error={errors.slug?.message} hint="Used in the URL: /category/slug">
          <Input id="cat-slug" {...register("slug", { onChange: () => setSlugTouched(true) })} />
        </Field>
      </div>
      <Field label="Description" htmlFor="cat-desc" error={errors.description?.message}>
        <Textarea id="cat-desc" rows={3} {...register("description")} />
      </Field>

      <Field label="Icon" error={errors.icon?.message} hint="Shown when the category has no image.">
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Icon" className="grid grid-cols-7 gap-1.5 sm:grid-cols-13">
              {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={field.value === key}
                  aria-label={key}
                  title={key}
                  onClick={() => field.onChange(key)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg border transition-colors",
                    field.value === key
                      ? "border-orange-brand bg-orange-brand/10 text-orange-600 ring-2 ring-orange-brand/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          )}
        />
      </Field>

      <Field label="Image" hint="Optional. Replaces the icon on category cards.">
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <ImageUploader
              value={field.value ? [field.value] : []}
              onChange={(imgs) => field.onChange(imgs[0] ?? null)}
              folder="categories"
              max={1}
              cloudinaryEnabled={cloudinaryEnabled}
            />
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort order" htmlFor="cat-sort" error={errors.sortOrder?.message}>
          <Input id="cat-sort" type="number" min={0} {...register("sortOrder")} />
        </Field>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <SwitchRow
              label="Active"
              description="Visible on the store"
              className="self-end"
              control={<Switch checked={!!field.value} onCheckedChange={field.onChange} />}
            />
          )}
        />
      </div>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">SEO (optional)</summary>
        <div className="mt-3 grid gap-3">
          <Field label="SEO title" htmlFor="cat-seo-title" error={errors.seo?.title?.message}>
            <Input id="cat-seo-title" maxLength={70} {...register("seo.title")} />
          </Field>
          <Field label="SEO description" htmlFor="cat-seo-desc" error={errors.seo?.description?.message}>
            <Textarea id="cat-seo-desc" rows={2} maxLength={170} {...register("seo.description")} />
          </Field>
        </div>
      </details>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="bg-navy hover:bg-navy/90">
          {pending && <Loader2 className="animate-spin" />}
          {category ? "Save changes" : "Create category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
