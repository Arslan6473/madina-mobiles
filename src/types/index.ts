import type { InquiryStatus, OrderStatus, PaymentMethod, UserRole } from "@/lib/constants";

/** Plain, serialisable shapes passed from the server to client components. */

export type ImageDTO = { url: string; publicId?: string; alt?: string };

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: ImageDTO;
  sortOrder: number;
  isActive: boolean;
  seo?: { title?: string; description?: string };
  productCount?: number;
};

export type VariantDTO = {
  id: string;
  sku?: string;
  attributes: { name: string; value: string }[];
  label: string;
  price?: number;
  salePrice?: number;
  stock: number;
};

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description: string;
  category: { id: string; name: string; slug: string } | null;
  brand: string;
  tags: string[];
  price: number;
  salePrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  stock: number;
  images: ImageDTO[];
  specifications: { label: string; value: string }[];
  variants: VariantDTO[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  seo?: { title?: string; description?: string; keywords?: string[] };
  createdAt: string;
  updatedAt: string;
};

/** Lightweight product shape for grids/cards. */
export type ProductCardDTO = Pick<
  ProductDTO,
  | "id"
  | "name"
  | "slug"
  | "brand"
  | "price"
  | "salePrice"
  | "stock"
  | "isBestSeller"
  | "isNewArrival"
  | "isFeatured"
  | "ratingAvg"
  | "ratingCount"
> & {
  image?: ImageDTO;
  categoryName?: string;
  hasVariants: boolean;
  createdAt: string;
};

export type OrderItemDTO = {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  slug: string;
  sku: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: { name: string; email?: string; phone: string; whatsapp?: string };
  shippingAddress: { address: string; city: string; province?: string; postalCode?: string; country: string };
  items: OrderItemDTO[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "refunded";
  status: OrderStatus;
  statusHistory: { status: OrderStatus; note?: string; at: string; by?: string }[];
  tracking?: { courier?: string; trackingNumber?: string; url?: string };
  customerNotes?: string;
  internalNotes?: { note: string; by: string; at: string }[];
  createdAt: string;
  updatedAt: string;
};

export type AddressDTO = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  addresses: AddressDTO[];
  createdAt: string;
};

export type SessionUser = { id: string; name: string; email: string; role: UserRole };

export type InquiryDTO = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export type ReviewDTO = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type StoreSettingsDTO = {
  storeName: string;
  tagline: string;
  ownerName: string;
  logo?: ImageDTO;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  announcement: string;
  announcementEnabled: boolean;
  social: { facebook?: string; instagram?: string; tiktok?: string; youtube?: string };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    wholesaleTitle: string;
    wholesaleText: string;
  };
};

/** Standard return shape for server actions. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number };
