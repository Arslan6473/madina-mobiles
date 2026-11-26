import { Schema, model, models, type Model, type Types } from "mongoose";
import { ImageSchema, type ImageAsset } from "./shared";

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: ImageAsset;
  sortOrder: number;
  isActive: boolean;
  seo?: { title?: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    icon: { type: String, trim: true },
    image: { type: ImageSchema },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

CategorySchema.index({ isActive: 1, sortOrder: 1 });

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) ?? model<ICategory>("Category", CategorySchema);
