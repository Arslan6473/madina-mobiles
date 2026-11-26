"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, User } from "@/models";
import { requireUser } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { addressSchema, changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation";
import { quoteCart } from "@/services/cart";
import type { ActionResult } from "@/types";
import { toActionError } from "./_utils";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    await User.updateOne({ _id: me.id }, { $set: { name: parsed.data.name, phone: parsed.data.phone ?? "" } });
    revalidatePath("/account", "layout");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    const user = await User.findById(me.id).select("+passwordHash sessionVersion role");
    if (!user) return { ok: false, error: "Account not found." };
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return { ok: false, error: "Current password is incorrect.", fieldErrors: { currentPassword: ["Incorrect password"] } };
    }
    user.passwordHash = await hashPassword(parsed.data.password);
    user.sessionVersion += 1; // invalidates sessions on other devices
    await user.save();
    await createSession({ sub: String(user._id), role: user.role, v: user.sessionVersion });
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveAddressAction(input: unknown, addressId?: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please check the address.", fieldErrors: fieldErrors(parsed.error) };
    await connectDB();
    const user = await User.findById(me.id);
    if (!user) return { ok: false, error: "Account not found." };
    const data = { ...parsed.data, country: "Pakistan" };

    if (addressId) {
      const addr = user.addresses.id(addressId);
      if (!addr) return { ok: false, error: "Address not found." };
      addr.set(data);
    } else {
      if (user.addresses.length >= 10) return { ok: false, error: "You can save up to 10 addresses." };
      user.addresses.push(data as never);
    }
    const target = addressId ? user.addresses.id(addressId) : user.addresses[user.addresses.length - 1];
    if (data.isDefault || user.addresses.length === 1) {
      user.addresses.forEach((a) => (a.isDefault = String(a._id) === String(target!._id)));
    }
    await user.save();
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    if (!Types.ObjectId.isValid(addressId)) return { ok: false, error: "Invalid address." };
    await connectDB();
    const user = await User.findById(me.id);
    if (!user) return { ok: false, error: "Account not found." };
    const addr = user.addresses.id(addressId);
    if (!addr) return { ok: false, error: "Address not found." };
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const me = await requireUser();
    await connectDB();
    const user = await User.findById(me.id);
    if (!user?.addresses.id(addressId)) return { ok: false, error: "Address not found." };
    user.addresses.forEach((a) => (a.isDefault = String(a._id) === addressId));
    await user.save();
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/**
 * Returns the items of a past order with CURRENT prices and stock so they can be
 * added back to the cart. Only the order's owner may reorder.
 */
export async function reorderAction(orderId: string) {
  try {
    const me = await requireUser();
    if (!Types.ObjectId.isValid(orderId)) return { ok: false as const, error: "Invalid order." };
    await connectDB();
    const order = await Order.findOne({ _id: orderId, user: me.id }).lean();
    if (!order) return { ok: false as const, error: "Order not found." };
    const quote = await quoteCart(
      order.items.map((i) => ({
        productId: String(i.product),
        variantId: i.variantId ? String(i.variantId) : undefined,
        quantity: i.quantity,
      })),
    );
    return { ok: true as const, data: quote.lines };
  } catch (e) {
    return toActionError(e);
  }
}
