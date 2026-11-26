import { Schema, model, models, type Model, type Types } from "mongoose";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/constants";
import { ImageSchema, type ImageAsset } from "./shared";

/* ---------------------------------- Inquiry --------------------------------- */

export interface IInquiry {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: INQUIRY_STATUSES, default: "new" },
  },
  { timestamps: true },
);
InquirySchema.index({ status: 1, createdAt: -1 });

export const Inquiry: Model<IInquiry> =
  (models.Inquiry as Model<IInquiry>) ?? model<IInquiry>("Inquiry", InquirySchema);

/* ---------------------------------- Review ---------------------------------- */

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1500 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

export const Review: Model<IReview> = (models.Review as Model<IReview>) ?? model<IReview>("Review", ReviewSchema);

/* ------------------------------- StoreSettings ------------------------------ */

export interface IStoreSettings {
  _id: Types.ObjectId;
  key: "store";
  storeName: string;
  tagline: string;
  ownerName: string;
  logo?: ImageAsset;
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
  /** 0 disables free delivery. */
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
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, default: "store", unique: true },
    storeName: { type: String, default: "Madina Mobile Gadgets" },
    tagline: { type: String, default: "Mobile Gadgets | Wholesale & Retail" },
    ownerName: { type: String, default: "Rashid Aslam" },
    logo: { type: ImageSchema },
    phone: { type: String, default: "0301-6597269" },
    whatsapp: { type: String, default: "0301-6597269" },
    email: { type: String },
    address: { type: String, default: "Medical Bazaar, near Akhtar Plaza" },
    city: { type: String, default: "Haroonabad" },
    country: { type: String, default: "Pakistan" },
    currency: { type: String, default: "PKR" },
    currencySymbol: { type: String, default: "Rs." },
    deliveryCharge: { type: Number, default: 250, min: 0 },
    freeDeliveryThreshold: { type: Number, default: 5000, min: 0 },
    announcement: {
      type: String,
      default: "Free delivery on orders above Rs. 5,000 · Cash on Delivery all over Pakistan",
    },
    announcementEnabled: { type: Boolean, default: true },
    social: { facebook: String, instagram: String, tiktok: String, youtube: String },
    homepage: {
      heroTitle: { type: String, default: "Original Mobile Accessories at Wholesale Prices" },
      heroSubtitle: {
        type: String,
        default: "Chargers, earbuds, power banks, cases and more — delivered to your door with Cash on Delivery.",
      },
      heroCtaLabel: { type: String, default: "Shop Now" },
      wholesaleTitle: { type: String, default: "Wholesale Deals for Shopkeepers" },
      wholesaleText: {
        type: String,
        default: "Buying in bulk? Get special wholesale rates on bulk orders. Message us on WhatsApp for a price list.",
      },
    },
  },
  { timestamps: true },
);

export const StoreSettings: Model<IStoreSettings> =
  (models.StoreSettings as Model<IStoreSettings>) ??
  model<IStoreSettings>("StoreSettings", StoreSettingsSchema);
