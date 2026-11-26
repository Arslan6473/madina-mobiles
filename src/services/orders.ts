import "server-only";
import { timingSafeEqual } from "node:crypto";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, Product, User, type IOrder } from "@/models";
import { randomToken } from "@/lib/auth/password";
import { toInternationalPhone } from "@/lib/format";
import type { OrderStatus } from "@/lib/constants";
import type { CheckoutDetails, CartLineInput } from "@/lib/validation";
import type { OrderDTO, Paginated, SessionUser } from "@/types";
import { quoteCart, type QuotedLine } from "./cart";
import { getStoreSettings } from "./settings";
import { toOrderDTO } from "./mappers";

export class OrderError extends Error {}

function generateOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `MMG-${ymd}-${suffix}`;
}

/** Atomically decrements stock for one line. Returns false if there wasn't enough stock. */
async function reserveLine(line: QuotedLine) {
  const filter = line.variantId
    ? {
        _id: new Types.ObjectId(line.productId),
        variants: { $elemMatch: { _id: new Types.ObjectId(line.variantId), stock: { $gte: line.quantity } } },
      }
    : { _id: new Types.ObjectId(line.productId), stock: { $gte: line.quantity } };
  const update = line.variantId
    ? { $inc: { "variants.$.stock": -line.quantity, soldCount: line.quantity } }
    : { $inc: { stock: -line.quantity, soldCount: line.quantity } };
  const res = await Product.updateOne(filter, update);
  return res.modifiedCount === 1;
}

async function releaseLine(line: { productId: string; variantId?: string; quantity: number }) {
  if (line.variantId) {
    await Product.updateOne(
      { _id: new Types.ObjectId(line.productId), "variants._id": new Types.ObjectId(line.variantId) },
      { $inc: { "variants.$.stock": line.quantity, soldCount: -line.quantity } },
    );
  } else {
    await Product.updateOne(
      { _id: new Types.ObjectId(line.productId) },
      { $inc: { stock: line.quantity, soldCount: -line.quantity } },
    );
  }
}

/**
 * Places a Cash-on-Delivery order. Prices are recomputed server-side and stock is
 * reserved with conditional atomic updates (rolled back if any line fails), which
 * works without a replica set. Swap in a transaction when running on Atlas if desired.
 */
export async function placeOrder(args: {
  details: CheckoutDetails;
  items: CartLineInput[];
  user: SessionUser | null;
  saveAddress?: boolean;
}) {
  await connectDB();
  const quote = await quoteCart(args.items);
  const problem = quote.lines.find((l) => l.issue);
  if (problem) {
    const reason =
      problem.issue === "insufficient_stock"
        ? `Only ${problem.availableStock} left of "${problem.name}". Please update your cart.`
        : problem.issue === "variant_required"
          ? `Please choose an option for "${problem.name}".`
          : `"${problem.name}" is no longer available. Please remove it from your cart.`;
    throw new OrderError(reason);
  }
  if (!quote.lines.length || quote.subtotal <= 0) throw new OrderError("Your cart is empty.");

  const reserved: QuotedLine[] = [];
  for (const line of quote.lines) {
    if (await reserveLine(line)) {
      reserved.push(line);
    } else {
      await Promise.all(reserved.map(releaseLine));
      throw new OrderError(`Sorry, "${line.name}" just went out of stock. Please review your cart.`);
    }
  }

  const settings = await getStoreSettings();
  const { details } = args;
  const accessToken = randomToken();
  try {
    let order: IOrder | null = null;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          accessToken,
          user: args.user ? new Types.ObjectId(args.user.id) : undefined,
          customer: {
            name: details.fullName,
            email: details.email,
            phone: details.phone,
            whatsapp: details.whatsapp,
          },
          shippingAddress: {
            address: details.address,
            city: details.city,
            province: details.province,
            postalCode: details.postalCode,
            country: settings.country,
          },
          items: quote.lines.map((l) => ({
            product: new Types.ObjectId(l.productId),
            variantId: l.variantId ? new Types.ObjectId(l.variantId) : undefined,
            variantLabel: l.variantLabel,
            name: l.name,
            slug: l.slug,
            sku: l.sku,
            image: l.image,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
          subtotal: quote.subtotal,
          shippingFee: quote.shippingFee,
          total: quote.total,
          currency: settings.currency,
          paymentMethod: "cod",
          status: "pending",
          statusHistory: [{ status: "pending", at: new Date(), note: "Order placed" }],
          customerNotes: details.notes,
        });
      } catch (e) {
        if ((e as { code?: number }).code !== 11000) throw e; // retry only on duplicate order number
      }
    }
    if (!order) throw new OrderError("Could not create order, please try again.");

    if (args.user && args.saveAddress) {
      const user = await User.findById(args.user.id);
      const exists = user?.addresses.some(
        (a) => a.address === details.address && a.city === details.city && a.phone === details.phone,
      );
      if (user && !exists && user.addresses.length < 10) {
        user.addresses.push({
          label: "Home",
          fullName: details.fullName,
          phone: details.phone,
          address: details.address,
          city: details.city,
          province: details.province,
          postalCode: details.postalCode,
          country: settings.country,
          isDefault: user.addresses.length === 0,
        } as never);
        await user.save();
      }
    }

    return { orderNumber: order.orderNumber, accessToken };
  } catch (error) {
    await Promise.all(reserved.map(releaseLine));
    throw error;
  }
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Returns an order only if the viewer may see it: the owner, an admin,
 * or a guest holding the order's secret access token.
 */
export async function getOrderForViewer(
  orderNumber: string,
  viewer: { user: SessionUser | null; token?: string },
): Promise<OrderDTO | null> {
  await connectDB();
  const order = await Order.findOne({ orderNumber }).select("+accessToken").lean();
  if (!order) return null;
  const isAdmin = viewer.user?.role === "admin";
  const isOwner = !!viewer.user && !!order.user && String(order.user) === viewer.user.id;
  const hasToken = !!viewer.token && safeEqual(viewer.token, order.accessToken);
  if (!isAdmin && !isOwner && !hasToken) return null;
  return toOrderDTO(order);
}

/** Public order tracking by order number + phone. Returns a limited view. */
export async function trackOrder(orderNumber: string, phone: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
  if (!order) return null;
  const match =
    toInternationalPhone(order.customer.phone) === toInternationalPhone(phone) ||
    (!!order.customer.whatsapp && toInternationalPhone(order.customer.whatsapp) === toInternationalPhone(phone));
  if (!match) return null;
  const dto = toOrderDTO(order);
  // Hide personal details in the public tracking view.
  return {
    orderNumber: dto.orderNumber,
    status: dto.status,
    statusHistory: dto.statusHistory,
    tracking: dto.tracking,
    createdAt: dto.createdAt,
    total: dto.total,
    itemCount: dto.items.reduce((s, i) => s + i.quantity, 0),
    city: dto.shippingAddress.city,
  };
}
export type TrackedOrder = NonNullable<Awaited<ReturnType<typeof trackOrder>>>;

export async function getUserOrders(userId: string) {
  await connectDB();
  const orders = await Order.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(100).lean();
  return orders.map((o) => toOrderDTO(o));
}

/* ----------------------------------- Admin ---------------------------------- */

export type AdminOrderQuery = {
  q?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
};

export async function listOrders(query: AdminOrderQuery): Promise<Paginated<OrderDTO>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, query.pageSize ?? 20);
  const filter: QueryFilter<IOrder> = {};
  if (query.status) filter.status = query.status;
  if (query.userId && Types.ObjectId.isValid(query.userId)) filter.user = new Types.ObjectId(query.userId);
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(`${query.from}T00:00:00+05:00`);
    if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999+05:00`);
  }
  const q = query.q?.trim();
  if (q) {
    const rx = new RegExp(q.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ orderNumber: rx }, { "customer.name": rx }, { "customer.phone": rx }, { "customer.email": rx }];
  }
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);
  return {
    items: items.map((o) => toOrderDTO(o, { includeInternal: true })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrderByIdAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const o = await Order.findById(id).lean();
  return o ? toOrderDTO(o, { includeInternal: true }) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus, by: string, note?: string) {
  await connectDB();
  const order = await Order.findById(id);
  if (!order) throw new OrderError("Order not found.");
  if (order.status === status) return;
  if (order.status === "cancelled") throw new OrderError("Cancelled orders cannot be changed.");
  if (order.status === "delivered" && status !== "delivered")
    throw new OrderError("Delivered orders cannot be moved back.");

  if (status === "cancelled") {
    // Return reserved stock to inventory.
    await Promise.all(
      order.items.map((i) =>
        releaseLine({
          productId: String(i.product),
          variantId: i.variantId ? String(i.variantId) : undefined,
          quantity: i.quantity,
        }),
      ),
    );
    order.cancelledAt = new Date();
  }
  if (status === "delivered") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "cod") order.paymentStatus = "paid";
  }
  order.status = status;
  order.statusHistory.push({ status, note, at: new Date(), by });
  await order.save();
}

export async function updateOrderTracking(
  id: string,
  tracking: { courier?: string; trackingNumber?: string; url?: string },
) {
  await connectDB();
  const res = await Order.updateOne({ _id: id }, { $set: { tracking } });
  if (!res.matchedCount) throw new OrderError("Order not found.");
}

export async function addOrderNote(id: string, note: string, by: string) {
  await connectDB();
  const res = await Order.updateOne({ _id: id }, { $push: { internalNotes: { note, by, at: new Date() } } });
  if (!res.matchedCount) throw new OrderError("Order not found.");
}
