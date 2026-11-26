"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Inquiry, Order, Product, Review } from "@/models";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, inquirySchema, reviewSchema } from "@/lib/validation";
import type { ActionResult } from "@/types";
import { toActionError } from "./_utils";

export async function submitInquiryAction(input: unknown): Promise<ActionResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  const limit = await rateLimit("inquiry", 5, 30 * 60_000);
  if (!limit.ok) return { ok: false, error: "You've sent several messages recently. Please try again later." };
  try {
    await connectDB();
    // `website` is the honeypot: the schema rejects it when filled, and the model has no such field.
    await Inquiry.create({ ...parsed.data, status: "new" });
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

async function recomputeRating(productId: Types.ObjectId) {
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAvg: Math.round((agg?.avg ?? 0) * 10) / 10, ratingCount: agg?.count ?? 0 } },
  );
}

/** Signed-in customers can review a product once. Reviews from verified buyers only. */
export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please check your review.", fieldErrors: fieldErrors(parsed.error) };
    const limit = await rateLimit("review", 10, 60 * 60_000, me.id);
    if (!limit.ok) return { ok: false, error: "Too many reviews. Please try again later." };
    await connectDB();
    const productId = new Types.ObjectId(parsed.data.productId);
    const product = await Product.findById(productId).select("slug").lean();
    if (!product) return { ok: false, error: "Product not found." };
    const purchased = await Order.exists({
      user: me.id,
      "items.product": productId,
      status: { $ne: "cancelled" },
    });
    if (!purchased) return { ok: false, error: "Only customers who ordered this product can review it." };
    if (await Review.exists({ product: productId, user: me.id }))
      return { ok: false, error: "You have already reviewed this product." };
    await Review.create({
      product: productId,
      user: me.id,
      name: me.name,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    await recomputeRating(productId);
    revalidatePath(`/product/${product.slug}`);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
