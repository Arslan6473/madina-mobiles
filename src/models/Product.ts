import { Schema, model, models, type Model, type Types } from "mongoose";
import { ImageSchema, type ImageAsset } from "./shared";

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface IVariant {
  _id: Types.ObjectId;
  sku?: string;
  attributes: VariantAttribute[];
  /** Overrides the product price when set. */
  price?: number;
  salePrice?: number;
  stock: number;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description: string;
  category: Types.ObjectId;
  brand: string;
  tags: string[];
  price: number;
  salePrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  /** Product-level stock. When variants exist, stock is tracked per variant instead. */
  stock: number;
  images: ImageAsset[];
  specifications: { label: string; value: string }[];
  variants: Types.DocumentArray<IVariant & Types.Subdocument>;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  seo?: { title?: string; description?: string; keywords?: string[] };
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  sku: { type: String, trim: true },
  attributes: [
    new Schema<VariantAttribute>(
      { name: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
      { _id: false },
    ),
  ],
  price: { type: Number, min: 0 },
  salePrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300 },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    wholesalePrice: { type: Number, min: 0 },
    wholesaleMinQty: { type: Number, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [ImageSchema], default: [] },
    specifications: {
      type: [new Schema({ label: String, value: String }, { _id: false })],
      default: [],
    },
    variants: { type: [VariantSchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: { type: [String], default: undefined },
    },
  },
  { timestamps: true },
);

ProductSchema.index(
  { name: "text", brand: "text", tags: "text", shortDescription: "text", description: "text" },
  { weights: { name: 10, brand: 5, tags: 4, shortDescription: 2, description: 1 }, name: "product_search" },
);
ProductSchema.index({ category: 1, isPublished: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isPublished: 1, createdAt: -1 });
ProductSchema.index({ isPublished: 1, soldCount: -1 });
ProductSchema.index({ stock: 1 });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ?? model<IProduct>("Product", ProductSchema);
