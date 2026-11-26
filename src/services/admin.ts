import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Inquiry, Order, Product, User, type IInquiry, type IProduct, type IUser } from "@/models";
import { LOW_STOCK_THRESHOLD, type InquiryStatus } from "@/lib/constants";
import type { Paginated, ProductCardDTO, UserDTO, InquiryDTO } from "@/types";
import { toCategoryDTO, toInquiryDTO, toOrderDTO, toProductCardDTO, toProductDTO, toUserDTO } from "./mappers";

const escape = (s: string) => s.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* --------------------------------- Dashboard -------------------------------- */

export async function getDashboardStats() {
  await connectDB();
  // Midnight in Pakistan (UTC+5, no DST) 29 days ago, independent of the server's time zone.
  const PKT_OFFSET = 5 * 3_600_000;
  const DAY = 86_400_000;
  const since = new Date(Math.floor((Date.now() + PKT_OFFSET) / DAY) * DAY - PKT_OFFSET - 29 * DAY);

  const [orderAgg, totalProducts, lowStock, pendingOrders, recentOrders, daily, topProducts, customers, newInquiries] =
    await Promise.all([
      Order.aggregate<{ _id: null; orders: number; sales: number }>([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, orders: { $sum: 1 }, sales: { $sum: "$total" } } },
      ]),
      Product.countDocuments(),
      Product.find({
        $or: [
          { variants: { $size: 0 }, stock: { $lte: LOW_STOCK_THRESHOLD } },
          { "variants.stock": { $lte: LOW_STOCK_THRESHOLD } },
        ],
      })
        .select("name slug sku stock variants images")
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      Order.countDocuments({ status: "pending" }),
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),
      Order.aggregate<{ _id: string; sales: number; orders: number }>([
        { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Karachi" } },
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate<{ _id: Types.ObjectId; name: string; quantity: number; revenue: number }>([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      User.countDocuments({ role: "customer" }),
      Inquiry.countDocuments({ status: "new" }),
    ]);

  // Fill gaps so the chart shows every day in the window.
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const salesSeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
    const row = byDay.get(key);
    return { date: key, sales: row?.sales ?? 0, orders: row?.orders ?? 0 };
  });

  return {
    totalOrders: orderAgg[0]?.orders ?? 0,
    totalSales: orderAgg[0]?.sales ?? 0,
    totalProducts,
    pendingOrders,
    customers,
    newInquiries,
    lowStock: lowStock.map((p) => {
      const dto = toProductDTO(p as never);
      const variantStock = dto.variants.length ? Math.min(...dto.variants.map((v) => v.stock)) : dto.stock;
      return { id: dto.id, name: dto.name, sku: dto.sku, stock: variantStock, image: dto.images[0]?.url };
    }),
    recentOrders: recentOrders.map((o) => toOrderDTO(o)),
    salesSeries,
    topProducts: topProducts.map((t) => ({ id: String(t._id), name: t.name, quantity: t.quantity, revenue: t.revenue })),
  };
}

/* --------------------------------- Products --------------------------------- */

export async function listProductsAdmin(query: {
  q?: string;
  category?: string;
  status?: "published" | "draft" | "low-stock";
  page?: number;
}): Promise<Paginated<ProductCardDTO & { sku: string; isPublished: boolean; categoryId?: string }>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = 20;
  const filter: QueryFilter<IProduct> = {};
  if (query.q?.trim()) {
    const rx = new RegExp(escape(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }];
  }
  if (query.category && Types.ObjectId.isValid(query.category)) filter.category = new Types.ObjectId(query.category);
  if (query.status === "published") filter.isPublished = true;
  if (query.status === "draft") filter.isPublished = false;
  if (query.status === "low-stock")
    filter.$and = [
      {
        $or: [
          { variants: { $size: 0 }, stock: { $lte: LOW_STOCK_THRESHOLD } },
          { "variants.stock": { $lte: LOW_STOCK_THRESHOLD } },
        ],
      },
    ];

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    items: docs.map((d) => ({
      ...toProductCardDTO(d as never),
      sku: d.sku,
      isPublished: d.isPublished,
      categoryId: d.category && typeof d.category === "object" && "_id" in d.category ? String(d.category._id) : undefined,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductByIdAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await Product.findById(id).populate("category", "name slug").lean();
  return doc ? toProductDTO(doc as never) : null;
}

/* -------------------------------- Categories -------------------------------- */

export async function listCategoriesAdmin() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return cats.map((c) => toCategoryDTO(c, map.get(String(c._id)) ?? 0));
}

export async function getCategoryByIdAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const c = await Category.findById(id).lean();
  return c ? toCategoryDTO(c) : null;
}

/* --------------------------------- Customers -------------------------------- */

export async function listCustomers(query: { q?: string; page?: number }): Promise<
  Paginated<UserDTO & { orderCount: number; totalSpent: number }>
> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = 20;
  const filter: QueryFilter<IUser> = { role: "customer" };
  if (query.q?.trim()) {
    const rx = new RegExp(escape(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await Order.aggregate<{ _id: Types.ObjectId; count: number; spent: number }>([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: "cancelled" } } },
    { $group: { _id: "$user", count: { $sum: 1 }, spent: { $sum: "$total" } } },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return {
    items: users.map((u) => ({
      ...toUserDTO(u as never),
      orderCount: map.get(String(u._id))?.count ?? 0,
      totalSpent: map.get(String(u._id))?.spent ?? 0,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomerAdmin(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const u = await User.findById(id).lean();
  return u ? toUserDTO(u as never) : null;
}

/* --------------------------------- Inquiries -------------------------------- */

export async function listInquiries(query: { status?: InquiryStatus; q?: string; page?: number }): Promise<
  Paginated<InquiryDTO>
> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = 20;
  const filter: QueryFilter<IInquiry> = {};
  if (query.status) filter.status = query.status;
  if (query.q?.trim()) {
    const rx = new RegExp(escape(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { subject: rx }, { message: rx }];
  }
  const [docs, total] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Inquiry.countDocuments(filter),
  ]);
  return { items: docs.map(toInquiryDTO), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** Cheap counts for the admin sidebar badges. */
export async function getAdminNavCounts() {
  await connectDB();
  const [pendingOrders, newInquiries] = await Promise.all([
    Order.countDocuments({ status: "pending" }),
    Inquiry.countDocuments({ status: "new" }),
  ]);
  return { pendingOrders, newInquiries };
}
