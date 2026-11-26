import { z } from "zod";
import { MAX_QTY_PER_LINE, ORDER_STATUSES, INQUIRY_STATUSES } from "@/lib/constants";
import { PK_MOBILE_REGEX } from "@/lib/format";

/* Shared by client forms (React Hook Form) and server actions — the server always re-validates. */

const trimmed = (max = 200) => z.string().trim().max(max);
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const phoneSchema = z
  .string()
  .trim()
  .regex(PK_MOBILE_REGEX, "Enter a valid mobile number, e.g. 0301-6597269");

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || PK_MOBILE_REGEX.test(v), "Enter a valid mobile number, e.g. 0301-6597269");

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

/* ----------------------------------- Auth ----------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z
  .object({
    name: trimmed(80).min(2, "Please enter your name"),
    email: z.email("Enter a valid email address").trim().toLowerCase(),
    phone: optionalPhone,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const profileSchema = z.object({
  name: trimmed(80).min(2, "Please enter your name"),
  phone: optionalPhone,
});

export const addressSchema = z.object({
  label: trimmed(30).min(1, "Label is required"),
  fullName: trimmed(80).min(2, "Full name is required"),
  phone: phoneSchema,
  address: trimmed(300).min(8, "Please enter your complete address"),
  city: trimmed(60).min(2, "City is required"),
  province: optionalText(60),
  postalCode: optionalText(12),
  isDefault: z.boolean().default(false),
});

/* --------------------------------- Checkout --------------------------------- */

export const cartLineSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  variantId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

export const checkoutDetailsSchema = z.object({
  fullName: trimmed(80).min(2, "Full name is required"),
  email: optionalEmail,
  phone: phoneSchema,
  whatsapp: optionalPhone,
  address: trimmed(300).min(8, "Please enter your complete address (house, street, area)"),
  city: trimmed(60).min(2, "City is required"),
  province: optionalText(60),
  postalCode: optionalText(12),
  notes: optionalText(1000),
});
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

export const placeOrderSchema = z.object({
  details: checkoutDetailsSchema,
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
  paymentMethod: z.literal("cod"),
  saveAddress: z.boolean().optional(),
});

export const trackOrderSchema = z.object({
  orderNumber: trimmed(30).min(4, "Enter your order number"),
  phone: phoneSchema,
});

/* --------------------------------- Inquiries -------------------------------- */

export const inquirySchema = z
  .object({
    name: trimmed(80).min(2, "Please enter your name"),
    email: optionalEmail,
    phone: optionalPhone,
    subject: optionalText(150),
    message: trimmed(3000).min(10, "Please write a little more detail (at least 10 characters)"),
    // Honeypot: real users never fill this hidden field.
    website: z.string().max(0).optional(),
  })
  .refine((d) => d.email || d.phone, { message: "Please provide an email or phone number", path: ["phone"] });

export const reviewSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  rating: z.number().int().min(1).max(5),
  comment: trimmed(1500).min(5, "Please write a short review"),
});

/* ----------------------------------- Admin ---------------------------------- */

const imageSchema = z.object({
  url: z.string().min(1).max(1000),
  publicId: z.string().max(300).optional(),
  alt: z.string().max(200).optional(),
});

const money = z.coerce.number().min(0, "Must be 0 or more").max(10_000_000);
const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number.isNaN(v) ? undefined : v),
  z.coerce.number().min(0).max(10_000_000).optional(),
);

export const variantSchema = z.object({
  id: z.string().optional(),
  sku: optionalText(60),
  attributes: z
    .array(z.object({ name: trimmed(40).min(1, "Required"), value: trimmed(60).min(1, "Required") }))
    .min(1, "Add at least one attribute"),
  price: optionalMoney,
  salePrice: optionalMoney,
  stock: z.coerce.number().int().min(0).max(1_000_000),
});

export const productSchema = z
  .object({
    name: trimmed(160).min(2, "Product name is required"),
    slug: optionalText(100),
    sku: trimmed(60)
      .min(2, "SKU is required")
      .regex(/^[A-Za-z0-9-_]+$/, "Use letters, numbers, - or _ only"),
    shortDescription: optionalText(300),
    description: z.string().trim().min(10, "Description is required").max(10000),
    category: z.string().regex(/^[a-f\d]{24}$/i, "Select a category"),
    brand: trimmed(60).min(1, "Brand is required"),
    tags: z.array(trimmed(40)).max(20).default([]),
    price: money.refine((v) => v > 0, "Price is required"),
    salePrice: optionalMoney,
    wholesalePrice: optionalMoney,
    wholesaleMinQty: z.preprocess(
      (v) => (v === "" || v === null || v === undefined || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().min(1).max(100000).optional(),
    ),
    stock: z.coerce.number().int().min(0).max(1_000_000),
    images: z.array(imageSchema).max(10, "Maximum 10 images").default([]),
    specifications: z
      .array(z.object({ label: trimmed(60).min(1, "Required"), value: trimmed(200).min(1, "Required") }))
      .max(40)
      .default([]),
    variants: z.array(variantSchema).max(50).default([]),
    isFeatured: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isPublished: z.boolean().default(true),
    seo: z
      .object({
        title: optionalText(70),
        description: optionalText(170),
        keywords: z.array(trimmed(40)).max(15).optional(),
      })
      .optional(),
  })
  .refine((d) => !d.salePrice || d.salePrice < d.price, {
    message: "Sale price must be lower than the regular price",
    path: ["salePrice"],
  })
  .superRefine((d, ctx) => {
    d.variants.forEach((v, i) => {
      const regular = v.price ?? d.price;
      if (v.salePrice && v.salePrice >= regular)
        ctx.addIssue({ code: "custom", message: "Sale price must be lower than the price", path: ["variants", i, "salePrice"] });
    });
  });
export type ProductInput = z.input<typeof productSchema>;
export type ProductParsed = z.output<typeof productSchema>;

export const categorySchema = z.object({
  name: trimmed(80).min(2, "Name is required"),
  slug: optionalText(100),
  description: optionalText(1000),
  icon: optionalText(40),
  image: imageSchema.optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
  seo: z.object({ title: optionalText(70), description: optionalText(170) }).optional(),
});
export type CategoryInput = z.input<typeof categorySchema>;

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i),
  status: z.enum(ORDER_STATUSES),
  note: optionalText(500),
});

export const orderTrackingSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i),
  courier: optionalText(60),
  trackingNumber: optionalText(80),
  url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https?:\/\//.test(v), "Must be a valid http(s) URL"),
});

export const orderNoteSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i),
  note: trimmed(1000).min(1, "Note cannot be empty"),
});

export const inquiryStatusSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  status: z.enum(INQUIRY_STATUSES),
});

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\//.test(v), "Must start with http:// or https://");

export const settingsSchema = z.object({
  storeName: trimmed(80).min(2),
  tagline: trimmed(120),
  ownerName: trimmed(80),
  logo: imageSchema.optional().nullable(),
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: optionalEmail,
  address: trimmed(200).min(5),
  city: trimmed(60).min(2),
  country: trimmed(60).min(2),
  currency: trimmed(5).min(3).toUpperCase(),
  currencySymbol: trimmed(5).min(1),
  deliveryCharge: money,
  freeDeliveryThreshold: money,
  announcement: trimmed(200),
  announcementEnabled: z.boolean(),
  social: z.object({
    facebook: optionalUrl,
    instagram: optionalUrl,
    tiktok: optionalUrl,
    youtube: optionalUrl,
  }),
  homepage: z.object({
    heroTitle: trimmed(120).min(3),
    heroSubtitle: trimmed(300),
    heroCtaLabel: trimmed(30).min(2),
    wholesaleTitle: trimmed(120),
    wholesaleText: trimmed(400),
  }),
});
export type SettingsInput = z.input<typeof settingsSchema>;

/** Converts a ZodError into a field-error map for ActionResult. */
export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
