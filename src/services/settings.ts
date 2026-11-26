import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { StoreSettings } from "@/models";
import { toSettingsDTO } from "./mappers";

/** Returns the singleton store settings, creating defaults on first access. Memoised per request. */
export const getStoreSettings = cache(async () => {
  await connectDB();
  const doc = await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { $setOnInsert: { key: "store" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  return toSettingsDTO(doc!);
});
