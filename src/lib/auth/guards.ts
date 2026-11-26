import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { readSession } from "./session";
import type { SessionUser } from "@/types";

/**
 * Resolves the signed-in user from the session cookie AND the database.
 * The DB check means deleted/deactivated users, role changes and bumped
 * session versions take effect immediately. Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.sub).select("name email role sessionVersion isActive").lean();
  if (!user || !user.isActive || user.sessionVersion !== session.v) return null;
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
});

export class AuthError extends Error {
  constructor(message = "You must be signed in to do that.") {
    super(message);
  }
}

/** For server actions: throws if not signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

/** For server actions / route handlers: throws unless the user is an admin. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new AuthError("Not authorised.");
  return user;
}

/** For pages: redirects to login if not signed in. */
export async function requireUserPage(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** For admin pages: redirects non-admins away. */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login`);
  if (user.role !== "admin") redirect("/");
  return user;
}
