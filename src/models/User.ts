import { Schema, model, models, type Model, type Types } from "mongoose";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { addressFields, type AddressFields } from "./shared";

export interface SavedAddress extends AddressFields {
  _id: Types.ObjectId;
  label: string;
  isDefault: boolean;
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  addresses: Types.DocumentArray<SavedAddress & Types.Subdocument>;
  /** Bumped on password change / logout-everywhere to invalidate existing sessions. */
  sessionVersion: number;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<SavedAddress>({
  label: { type: String, default: "Home", trim: true },
  ...addressFields,
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "customer", index: true },
    addresses: { type: [AddressSchema], default: [] },
    sessionVersion: { type: Number, default: 0 },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.index({ name: "text", email: "text", phone: "text" });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> = (models.User as Model<IUser>) ?? model<IUser>("User", UserSchema);
