"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { cartLineSchema, fieldErrors, placeOrderSchema, trackOrderSchema } from "@/lib/validation";
import { quoteCart, type CartQuote } from "@/services/cart";
import { placeOrder, trackOrder, type TrackedOrder } from "@/services/orders";
import type { ActionResult } from "@/types";
import { toActionError } from "./_utils";

/** Re-prices the client cart against the database (current prices, stock, shipping). */
export async function quoteCartAction(items: unknown): Promise<ActionResult<CartQuote>> {
  const parsed = z.array(cartLineSchema).max(50).safeParse(items);
  if (!parsed.success) return { ok: false, error: "Invalid cart." };
  try {
    return { ok: true, data: await quoteCart(parsed.data) };
  } catch (e) {
    return toActionError(e);
  }
}

export async function placeOrderAction(
  input: unknown,
): Promise<ActionResult<{ orderNumber: string; accessToken: string }>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrors(parsed.error);
    return { ok: false, error: "Please check your delivery details.", fieldErrors: fe };
  }
  const limit = await rateLimit("place-order", 10, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many orders in a short time. Please wait a few minutes." };

  try {
    const user = await getCurrentUser();
    const result = await placeOrder({
      details: parsed.data.details,
      items: parsed.data.items,
      user,
      saveAddress: parsed.data.saveAddress,
    });
    return { ok: true, data: result };
  } catch (e) {
    return toActionError(e);
  }
}

export async function trackOrderAction(input: unknown): Promise<ActionResult<TrackedOrder>> {
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
  const limit = await rateLimit("track", 20, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes." };
  try {
    const order = await trackOrder(parsed.data.orderNumber, parsed.data.phone);
    if (!order) return { ok: false, error: "No order found with that order number and phone number." };
    return { ok: true, data: order };
  } catch (e) {
    return toActionError(e);
  }
}
