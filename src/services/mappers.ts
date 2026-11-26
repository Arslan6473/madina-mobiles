import "server-only";
import type { Types } from "mongoose";
import type { ICategory, IInquiry, IOrder, IProduct, IReview, IStoreSettings, IUser } from "@/models";
import type {
  CategoryDTO,
  InquiryDTO,
  OrderDTO,
  ProductCardDTO,
  ProductDTO,
  ReviewDTO,
  StoreSettingsDTO,
  UserDTO,
} from "@/types";
import { variantLabel } from "@/lib/pricing";

/* Lean documents → plain JSON-safe DTOs. Keep all serialisation in one place. */

type Lean<T> = Omit<T, "variants" | "addresses">;
const iso = (d?: Date | string) => (d ? new Date(d).toISOString() : new Date(0).toISOString());
const img = (i?: { url: string; publicId?: string; alt?: string } | null) =>
  i?.url ? { url: i.url, publicId: i.publicId, alt: i.alt ?? "" } : undefined;

export function toCategoryDTO(c: Lean<ICategory>, productCount?: number): CategoryDTO {
  return {
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    image: img(c.image),
    sortOrder: c.sortOrder ?? 0,
    isActive: c.isActive,
    seo: c.seo ? { title: c.seo.title, description: c.seo.description } : undefined,
    productCount,
  };
}

type PopulatedCategory = { _id: Types.ObjectId; name: string; slug: string } | Types.ObjectId | null;

function categoryRef(cat: PopulatedCategory) {
  if (cat && typeof cat === "object" && "name" in cat) return { id: String(cat._id), name: cat.name, slug: cat.slug };
  return null;
}

export function toProductDTO(p: Lean<IProduct> & { variants?: IProduct["variants"] | unknown[] }): ProductDTO {
  const variants = (p.variants ?? []) as unknown as {
    _id: Types.ObjectId;
    sku?: string;
    attributes: { name: string; value: string }[];
    price?: number;
    salePrice?: number;
    stock: number;
  }[];
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: p.shortDescription,
    description: p.description,
    category: categoryRef(p.category as unknown as PopulatedCategory),
    brand: p.brand,
    tags: p.tags ?? [],
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    wholesalePrice: p.wholesalePrice ?? undefined,
    wholesaleMinQty: p.wholesaleMinQty ?? undefined,
    stock: p.stock,
    images: (p.images ?? []).map((i) => img(i)!).filter(Boolean),
    specifications: (p.specifications ?? []).map((s) => ({ label: s.label, value: s.value })),
    variants: variants.map((v) => ({
      id: String(v._id),
      sku: v.sku,
      attributes: (v.attributes ?? []).map((a) => ({ name: a.name, value: a.value })),
      label: variantLabel(v.attributes ?? []),
      price: v.price ?? undefined,
      salePrice: v.salePrice ?? undefined,
      stock: v.stock,
    })),
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isPublished: p.isPublished,
    soldCount: p.soldCount ?? 0,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    seo: p.seo
      ? { title: p.seo.title, description: p.seo.description, keywords: p.seo.keywords ?? undefined }
      : undefined,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

export function toProductCardDTO(p: Lean<IProduct> & { variants?: unknown[] }): ProductCardDTO {
  const variants = (p.variants ?? []) as { stock: number }[];
  const cat = categoryRef(p.category as unknown as PopulatedCategory);
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    stock: variants.length ? variants.reduce((s, v) => s + (v.stock ?? 0), 0) : p.stock,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    image: img(p.images?.[0]),
    categoryName: cat?.name,
    hasVariants: variants.length > 0,
    createdAt: iso(p.createdAt),
  };
}

export function toOrderDTO(o: Lean<IOrder>, opts: { includeInternal?: boolean } = {}): OrderDTO {
  return {
    id: String(o._id),
    orderNumber: o.orderNumber,
    userId: o.user ? String(o.user) : undefined,
    customer: { ...o.customer },
    shippingAddress: { ...o.shippingAddress },
    items: o.items.map((i) => ({
      productId: String(i.product),
      variantId: i.variantId ? String(i.variantId) : undefined,
      variantLabel: i.variantLabel,
      name: i.name,
      slug: i.slug,
      sku: i.sku,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    discount: o.discount ?? 0,
    total: o.total,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    statusHistory: (o.statusHistory ?? []).map((h) => ({
      status: h.status,
      note: h.note,
      at: iso(h.at),
      by: opts.includeInternal ? h.by : undefined,
    })),
    tracking: o.tracking
      ? { courier: o.tracking.courier, trackingNumber: o.tracking.trackingNumber, url: o.tracking.url }
      : undefined,
    customerNotes: o.customerNotes,
    internalNotes: opts.includeInternal
      ? (o.internalNotes ?? []).map((n) => ({ note: n.note, by: n.by, at: iso(n.at) }))
      : undefined,
    createdAt: iso(o.createdAt),
    updatedAt: iso(o.updatedAt),
  };
}

export function toUserDTO(u: Lean<IUser> & { addresses?: unknown[] }): UserDTO {
  const addresses = (u.addresses ?? []) as (IUser["addresses"][number] & { _id: Types.ObjectId })[];
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    addresses: addresses.map((a) => ({
      id: String(a._id),
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      country: a.country ?? "Pakistan",
      isDefault: !!a.isDefault,
    })),
    createdAt: iso(u.createdAt),
  };
}

export function toInquiryDTO(i: Lean<IInquiry>): InquiryDTO {
  return {
    id: String(i._id),
    name: i.name,
    email: i.email,
    phone: i.phone,
    subject: i.subject,
    message: i.message,
    status: i.status,
    createdAt: iso(i.createdAt),
  };
}

export function toReviewDTO(r: Lean<IReview>): ReviewDTO {
  return {
    id: String(r._id),
    productId: String(r.product),
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: iso(r.createdAt),
  };
}

export function toSettingsDTO(s: Lean<IStoreSettings>): StoreSettingsDTO {
  return {
    storeName: s.storeName,
    tagline: s.tagline,
    ownerName: s.ownerName,
    logo: img(s.logo),
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    address: s.address,
    city: s.city,
    country: s.country,
    currency: s.currency,
    currencySymbol: s.currencySymbol,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    announcement: s.announcement,
    announcementEnabled: s.announcementEnabled,
    social: { ...(s.social ?? {}) },
    homepage: { ...s.homepage },
  };
}
