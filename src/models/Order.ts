import { Schema, model, models, type Model, type Types } from "mongoose";
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderStatus, type PaymentMethod } from "@/lib/constants";

/** Snapshot of the product at the time of ordering — never re-read from Product for history. */
export interface IOrderItem {
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  variantLabel?: string;
  name: string;
  slug: string;
  sku: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  /** Random secret that lets a guest view their own order without an account. */
  accessToken: string;
  user?: Types.ObjectId;
  customer: { name: string; email?: string; phone: string; whatsapp?: string };
  shippingAddress: { address: string; city: string; province?: string; postalCode?: string; country: string };
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "refunded";
  status: OrderStatus;
  statusHistory: { status: OrderStatus; note?: string; at: Date; by?: string }[];
  tracking?: { courier?: string; trackingNumber?: string; url?: string };
  customerNotes?: string;
  internalNotes: { note: string; by: string; at: Date }[];
  cancelledAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId },
    variantLabel: { type: String },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true, select: false },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      whatsapp: { type: String, trim: true },
    },
    shippingAddress: {
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: "Pakistan" },
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "PKR" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "cod" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    statusHistory: {
      type: [
        new Schema(
          { status: { type: String, enum: ORDER_STATUSES }, note: String, at: Date, by: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    tracking: { courier: String, trackingNumber: String, url: String },
    customerNotes: { type: String, trim: true, maxlength: 1000 },
    internalNotes: {
      type: [new Schema({ note: String, by: String, at: Date }, { _id: false })],
      default: [],
    },
    cancelledAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true },
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "customer.email": 1 });
OrderSchema.index({ "customer.phone": 1 });

export const Order: Model<IOrder> = (models.Order as Model<IOrder>) ?? model<IOrder>("Order", OrderSchema);
