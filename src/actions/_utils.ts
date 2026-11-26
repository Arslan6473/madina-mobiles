import "server-only";
import { AuthError } from "@/lib/auth/guards";
import { OrderError } from "@/services/orders";
import type { ActionResult } from "@/types";

/** Converts known errors into user-facing messages; hides unexpected internals. */
export function toActionError(error: unknown): Extract<ActionResult, { ok: false }> {
  if (error instanceof AuthError || error instanceof OrderError) return { ok: false, error: error.message };
  if (error instanceof UserFacingError) return { ok: false, error: error.message };
  if ((error as { code?: number })?.code === 11000) {
    const field = Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})[0] ?? "value";
    return { ok: false, error: `That ${field} is already in use.`, fieldErrors: { [field]: [`This ${field} already exists`] } };
  }
  console.error("[action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export class UserFacingError extends Error {}
