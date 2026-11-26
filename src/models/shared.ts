import { Schema } from "mongoose";

export interface ImageAsset {
  url: string;
  publicId?: string;
  alt?: string;
}

export const ImageSchema = new Schema<ImageAsset>(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

export interface AddressFields {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
}

export const addressFields = {
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  province: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, default: "Pakistan" },
} as const;
