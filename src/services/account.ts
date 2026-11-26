import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import type { UserDTO } from "@/types";
import { toUserDTO } from "./mappers";

/** Profile + saved addresses for the signed-in customer's account pages. */
export async function getUserProfile(userId: string): Promise<UserDTO | null> {
  if (!Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  const u = await User.findById(userId).lean();
  return u ? toUserDTO(u as never) : null;
}
