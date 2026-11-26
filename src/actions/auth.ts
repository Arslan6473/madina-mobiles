"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { createSession, destroySession } from "@/lib/auth/session";
import { createResetToken, hashPassword, sha256, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mailer";
import { siteUrl } from "@/lib/env";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import type { ActionResult, SessionUser } from "@/types";
import { toActionError } from "./_utils";

// Constant-time-ish failure path: compare against a dummy hash when the user doesn't exist.
const DUMMY_HASH = "$2b$12$JDctBrbGaPRCx1Su237kOOF0Vuaregw.buPArTyhgwwH9fdrEKoPy";

async function signIn(input: unknown, opts: { adminOnly: boolean }): Promise<ActionResult<SessionUser>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const limit = await rateLimit(opts.adminOnly ? "admin-login" : "login", 8, 15 * 60_000, undefined);
  const perAccount = await rateLimit("login-account", 10, 15 * 60_000, email);
  if (!limit.ok || !perAccount.ok)
    return { ok: false, error: "Too many sign-in attempts. Please wait a few minutes and try again." };

  try {
    await connectDB();
    const user = await User.findOne({ email }).select("+passwordHash name email role sessionVersion isActive");
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.isActive) return { ok: false, error: "Invalid email or password." };
    if (opts.adminOnly && user.role !== "admin") return { ok: false, error: "Invalid email or password." };

    user.lastLoginAt = new Date();
    await user.save();
    await createSession({ sub: String(user._id), role: user.role, v: user.sessionVersion });
    return { ok: true, data: { id: String(user._id), name: user.name, email: user.email, role: user.role } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function loginAction(input: unknown) {
  return signIn(input, { adminOnly: false });
}

export async function adminLoginAction(input: unknown) {
  return signIn(input, { adminOnly: true });
}

export async function registerAction(input: unknown): Promise<ActionResult<SessionUser>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
  const limit = await rateLimit("register", 5, 60 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many accounts created from this network. Try again later." };

  try {
    await connectDB();
    const { name, email, phone, password } = parsed.data;
    if (await User.exists({ email })) {
      return {
        ok: false,
        error: "An account with this email already exists.",
        fieldErrors: { email: ["An account with this email already exists"] },
      };
    }
    const user = await User.create({ name, email, phone, passwordHash: await hashPassword(password), role: "customer" });
    await createSession({ sub: String(user._id), role: "customer", v: user.sessionVersion });
    return { ok: true, data: { id: String(user._id), name: user.name, email: user.email, role: user.role } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function logoutAction(): Promise<ActionResult> {
  await destroySession();
  return { ok: true };
}

export async function getSessionUserAction() {
  return getCurrentUser();
}

/** Always returns success so the form can't be used to discover registered emails. */
export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address.", fieldErrors: fieldErrors(parsed.error) };
  const limit = await rateLimit("forgot", 5, 60 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many requests. Please try again later." };

  try {
    await connectDB();
    const user = await User.findOne({ email: parsed.data.email, isActive: true });
    if (user) {
      const { token, hash } = createResetToken();
      user.resetTokenHash = hash;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60_000);
      await user.save();
      const link = `${siteUrl}/reset-password?token=${token}`;
      await sendMail({
        to: user.email,
        subject: "Reset your Madina Mobile Gadgets password",
        text: `Assalam o Alaikum ${user.name},\n\nUse this link to reset your password (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
      });
    }
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details.", fieldErrors: fieldErrors(parsed.error) };
  const limit = await rateLimit("reset", 10, 60 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please try again later." };
  try {
    await connectDB();
    const user = await User.findOne({
      resetTokenHash: sha256(parsed.data.token),
      resetTokenExpires: { $gt: new Date() },
    }).select("+resetTokenHash +resetTokenExpires");
    if (!user) return { ok: false, error: "This reset link is invalid or has expired. Please request a new one." };
    user.passwordHash = await hashPassword(parsed.data.password);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.sessionVersion += 1; // sign out all existing sessions
    await user.save();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
