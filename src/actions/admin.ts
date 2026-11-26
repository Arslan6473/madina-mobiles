"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Inquiry, Product, Review, StoreSettings } from "@/models";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteImage, isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { slugify } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import {
  categorySchema,
  fieldErrors,
  inquiryStatusSchema,
  orderNoteSchema,
  orderStatusUpdateSchema,
  orderTrackingSchema,
  productSchema,
  settingsSchema,
} from "@/lib/validation";
import { addOrderNote, updateOrderStatus, updateOrderTracking } from "@/services/orders";
import type { ActionResult, ImageDTO } from "@/types";
import { toActionError, UserFacingError } from "./_utils";

/* Every action here calls requireAdmin() first — the admin UI being hidden is not a security boundary. */

function refreshStorefront() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(model: "product" | "category", base: string, excludeId?: string) {
  const M = model === "product" ? Product : Category;
  const root = slugify(base) || model;
  let slug = root;
  for (let i = 2; await (M as typeof Product).exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i++) {
    slug = `${root}-${i}`;
  }
  return slug;
}

/* ---------------------------------- Uploads --------------------------------- */

export async function uploadImageAction(formData: FormData): Promise<ActionResult<ImageDTO>> {
  try {
    const admin = await requireAdmin();
    const limit = await rateLimit("upload", 60, 10 * 60_000, admin.id);
    if (!limit.ok) return { ok: false, error: "Too many uploads. Please wait a moment." };
    if (!isCloudinaryConfigured())
      return { ok: false, error: "Cloudinary is not configured. Add CLOUDINARY_* keys to the environment." };
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "products");
    if (!(file instanceof File)) return { ok: false, error: "No file received." };
    if (!["products", "categories", "branding"].includes(folder)) return { ok: false, error: "Invalid folder." };
    const result = await uploadImage(file, folder as "products" | "categories" | "branding");
    return { ok: true, data: { ...result, alt: "" } };
  } catch (e) {
    if (e instanceof Error && /Image|image|file|File|configured/.test(e.message))
      return { ok: false, error: e.message };
    return toActionError(e);
  }
}

/** Deletes a freshly uploaded image that was never saved (e.g. removed before saving the form). */
export async function discardUploadAction(publicId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const inUse =
      (await Product.exists({ "images.publicId": publicId })) ||
      (await Category.exists({ "image.publicId": publicId })) ||
      (await StoreSettings.exists({ "logo.publicId": publicId }));
    if (!inUse) await deleteImage(publicId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/* --------------------------------- Products --------------------------------- */

export async function saveProductAction(input: unknown, productId?: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    const data = parsed.data;
    if (!(await Category.exists({ _id: data.category })))
      return { ok: false, error: "Selected category does not exist.", fieldErrors: { category: ["Invalid category"] } };

    const existing = productId ? await Product.findById(productId) : null;
    if (productId && !existing) return { ok: false, error: "Product not found." };

    const slug = await uniqueSlug("product", data.slug || data.name, productId);
    const doc = {
      ...data,
      slug,
      sku: data.sku.toUpperCase(),
      variants: data.variants.map((v) => ({
        ...(v.id && Types.ObjectId.isValid(v.id) ? { _id: new Types.ObjectId(v.id) } : {}),
        sku: v.sku,
        attributes: v.attributes,
        price: v.price,
        salePrice: v.salePrice,
        stock: v.stock,
      })),
      // With variants, product-level stock mirrors the variant total for listing/filters.
      stock: data.variants.length ? data.variants.reduce((s, v) => s + v.stock, 0) : data.stock,
    };

    let id: string;
    if (existing) {
      const removed = existing.images.filter((img) => !data.images.some((n) => n.publicId === img.publicId));
      existing.set(doc);
      if (data.salePrice === undefined) existing.set("salePrice", undefined);
      if (data.wholesalePrice === undefined) existing.set("wholesalePrice", undefined);
      await existing.save();
      await Promise.all(removed.map((img) => deleteImage(img.publicId)));
      id = String(existing._id);
    } else {
      const created = await Product.create(doc);
      id = String(created._id);
    }
    refreshStorefront();
    revalidatePath("/admin/products");
    return { ok: true, data: { id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const product = await Product.findById(productId);
    if (!product) return { ok: false, error: "Product not found." };
    await product.deleteOne();
    await Review.deleteMany({ product: product._id });
    // Order history keeps its own snapshot (name/price/image URL), so deleting is safe.
    await Promise.all(product.images.map((img) => deleteImage(img.publicId)));
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function toggleProductFlagAction(
  productId: string,
  flag: "isPublished" | "isFeatured" | "isBestSeller" | "isNewArrival",
  value: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!["isPublished", "isFeatured", "isBestSeller", "isNewArrival"].includes(flag))
      return { ok: false, error: "Invalid flag." };
    await connectDB();
    await Product.updateOne({ _id: productId }, { $set: { [flag]: !!value } });
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/* -------------------------------- Categories -------------------------------- */

export async function saveCategoryAction(input: unknown, categoryId?: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    const data = parsed.data;
    const slug = await uniqueSlug("category", data.slug || data.name, categoryId);
    let id: string;
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (!cat) return { ok: false, error: "Category not found." };
      const oldImage = cat.image?.publicId;
      cat.set({ ...data, slug, image: data.image ?? undefined });
      await cat.save();
      if (oldImage && oldImage !== data.image?.publicId) await deleteImage(oldImage);
      id = String(cat._id);
    } else {
      const cat = await Category.create({ ...data, slug, image: data.image ?? undefined });
      id = String(cat._id);
    }
    refreshStorefront();
    return { ok: true, data: { id } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    const count = await Product.countDocuments({ category: categoryId });
    if (count > 0)
      throw new UserFacingError(
        `This category has ${count} product(s). Move or delete them first, or disable the category instead.`,
      );
    const cat = await Category.findByIdAndDelete(categoryId);
    if (!cat) return { ok: false, error: "Category not found." };
    await deleteImage(cat.image?.publicId);
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function toggleCategoryActiveAction(categoryId: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await Category.updateOne({ _id: categoryId }, { $set: { isActive: !!isActive } });
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/* ---------------------------------- Orders ---------------------------------- */

export async function updateOrderStatusAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = orderStatusUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid status update." };
    await updateOrderStatus(parsed.data.orderId, parsed.data.status, admin.name, parsed.data.note);
    revalidatePath("/admin/orders", "layout");
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateOrderTrackingAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = orderTrackingSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Please check the tracking details.", fieldErrors: fieldErrors(parsed.error) };
    const { orderId, ...tracking } = parsed.data;
    await updateOrderTracking(orderId, tracking);
    revalidatePath("/admin/orders", "layout");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function addOrderNoteAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = orderNoteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Note cannot be empty." };
    await addOrderNote(parsed.data.orderId, parsed.data.note, admin.name);
    revalidatePath("/admin/orders", "layout");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/* --------------------------------- Inquiries -------------------------------- */

export async function setInquiryStatusAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = inquiryStatusSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    await connectDB();
    await Inquiry.updateOne({ _id: parsed.data.id }, { $set: { status: parsed.data.status } });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteInquiryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await connectDB();
    await Inquiry.deleteOne({ _id: id });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/* --------------------------------- Settings --------------------------------- */

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    const prev = await StoreSettings.findOne({ key: "store" }).lean();
    const { logo, ...rest } = parsed.data;
    await StoreSettings.updateOne(
      { key: "store" },
      logo ? { $set: { ...rest, logo } } : { $set: rest, $unset: { logo: 1 } },
      { upsert: true },
    );
    if (prev?.logo?.publicId && prev.logo.publicId !== logo?.publicId) await deleteImage(prev.logo.publicId);
    refreshStorefront();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
