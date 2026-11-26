import "server-only";
import { cache } from "react";
import { Types, type PipelineStage, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Product, Review, type IProduct } from "@/models";
import { PAGE_SIZE, type ProductSort } from "@/lib/constants";
import { toCategoryDTO, toProductCardDTO, toProductDTO, toReviewDTO } from "./mappers";
import type { Paginated, ProductCardDTO } from "@/types";

const CARD_FIELDS = "name slug brand price salePrice stock isBestSeller isNewArrival isFeatured ratingAvg ratingCount images category variants.stock createdAt";

/* -------------------------------- Categories -------------------------------- */

export const getActiveCategories = cache(async () => {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return cats.map((c) => toCategoryDTO(c, countMap.get(String(c._id)) ?? 0));
});

export const getCategoryBySlug = cache(async (slug: string) => {
  await connectDB();
  const cat = await Category.findOne({ slug, isActive: true }).lean();
  return cat ? toCategoryDTO(cat) : null;
});

/* --------------------------------- Products --------------------------------- */

export type ProductQuery = {
  q?: string;
  category?: string; // slug
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

/** Effective selling price (sale price when present) used for filtering & sorting. */
const effectivePriceExpr = {
  $cond: [
    { $and: [{ $gt: ["$salePrice", 0] }, { $lt: ["$salePrice", "$price"] }] },
    "$salePrice",
    "$price",
  ],
};

export async function searchProducts(query: ProductQuery): Promise<Paginated<ProductCardDTO>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, query.pageSize ?? PAGE_SIZE);

  const match: QueryFilter<IProduct> = { isPublished: true };
  if (query.category) {
    const cat = await Category.findOne({ slug: query.category, isActive: true }).select("_id").lean();
    if (!cat) return { items: [], total: 0, page, pageSize, totalPages: 0 };
    match.category = cat._id;
  }
  if (query.brands?.length) match.brand = { $in: query.brands };
  if (query.inStock) match.$or = [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }];

  const words = (query.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length) {
    // Every word must match at least one searchable field (partial matches allowed, e.g. "char" → charger).
    match.$and = words.map((w) => {
      const rx = new RegExp(w.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return { $or: [{ name: rx }, { brand: rx }, { tags: rx }, { sku: rx }, { shortDescription: rx }] };
    });
  }

  const priceMatch: Record<string, number> = {};
  if (query.minPrice != null && query.minPrice > 0) priceMatch.$gte = query.minPrice;
  if (query.maxPrice != null && query.maxPrice > 0) priceMatch.$lte = query.maxPrice;

  const sortStage: Record<string, 1 | -1> =
    query.sort === "price-asc"
      ? { effectivePrice: 1, _id: 1 }
      : query.sort === "price-desc"
        ? { effectivePrice: -1, _id: 1 }
        : query.sort === "popular"
          ? { soldCount: -1, ratingAvg: -1, _id: 1 }
          : { createdAt: -1, _id: 1 };

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $addFields: { effectivePrice: effectivePriceExpr } },
    ...(Object.keys(priceMatch).length ? [{ $match: { effectivePrice: priceMatch } }] : []),
    {
      $facet: {
        items: [
          { $sort: sortStage },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
          { $set: { category: { $first: "$category" } } },
          {
            $project: Object.fromEntries(CARD_FIELDS.split(" ").map((f) => [f, 1])),
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ];

  const [result] = await Product.aggregate<{ items: IProduct[]; total: { n: number }[] }>(pipeline);
  const total = result?.total[0]?.n ?? 0;
  return {
    items: (result?.items ?? []).map((p) => toProductCardDTO(p as never)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export const getBrands = cache(async (categorySlug?: string) => {
  await connectDB();
  const match: QueryFilter<IProduct> = { isPublished: true };
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
    if (cat) match.category = cat._id;
  }
  const brands: string[] = await Product.distinct("brand", match);
  return brands.sort((a, b) => a.localeCompare(b));
});

export const getPriceBounds = cache(async () => {
  await connectDB();
  const [r] = await Product.aggregate<{ min: number; max: number }>([
    { $match: { isPublished: true } },
    { $group: { _id: null, min: { $min: effectivePriceExpr }, max: { $max: effectivePriceExpr } } },
  ]);
  return { min: r?.min ?? 0, max: r?.max ?? 0 };
});

async function productCards(filter: QueryFilter<IProduct>, sort: Record<string, 1 | -1>, limit: number) {
  await connectDB();
  const docs = await Product.find({ isPublished: true, ...filter })
    .select(CARD_FIELDS)
    .populate("category", "name slug")
    .sort(sort)
    .limit(limit)
    .lean();
  return docs.map((d) => toProductCardDTO(d as never));
}

export const getFeaturedProducts = cache((limit = 8) => productCards({ isFeatured: true }, { createdAt: -1 }, limit));
export const getBestSellers = cache((limit = 8) =>
  productCards({ isBestSeller: true }, { soldCount: -1, createdAt: -1 }, limit),
);
export const getLatestProducts = cache((limit = 8) => productCards({}, { createdAt: -1 }, limit));
export const getSaleProducts = cache((limit = 8) =>
  productCards({ salePrice: { $gt: 0 } }, { updatedAt: -1 }, limit),
);
export const getWholesaleProducts = cache((limit = 4) =>
  productCards({ wholesalePrice: { $gt: 0 } }, { soldCount: -1 }, limit),
);

export const getProductBySlug = cache(async (slug: string) => {
  await connectDB();
  const doc = await Product.findOne({ slug, isPublished: true }).populate("category", "name slug").lean();
  return doc ? toProductDTO(doc as never) : null;
});

export async function getRelatedProducts(productId: string, categoryId: string | undefined, limit = 4) {
  if (!categoryId) return [];
  return productCards(
    { _id: { $ne: new Types.ObjectId(productId) }, category: new Types.ObjectId(categoryId) },
    { soldCount: -1 },
    limit,
  );
}

export async function getProductReviews(productId: string, limit = 20) {
  await connectDB();
  const reviews = await Review.find({ product: productId, isApproved: true }).sort({ createdAt: -1 }).limit(limit).lean();
  return reviews.map((r) => toReviewDTO(r));
}

/** Latest approved reviews across the store, for homepage testimonials. */
export const getRecentReviews = cache(async (limit = 6) => {
  await connectDB();
  const reviews = await Review.find({ isApproved: true, rating: { $gte: 4 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("product", "name slug")
    .lean();
  return reviews.map((r) => ({
    ...toReviewDTO(r as never),
    product: r.product && typeof r.product === "object" && "name" in r.product
      ? { name: (r.product as unknown as { name: string }).name, slug: (r.product as unknown as { slug: string }).slug }
      : undefined,
  }));
});

/** For sitemap generation. */
export async function getAllPublishedSlugs() {
  await connectDB();
  const [products, categories] = await Promise.all([
    Product.find({ isPublished: true }).select("slug updatedAt").lean(),
    Category.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);
  return {
    products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
    categories: categories.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
  };
}
