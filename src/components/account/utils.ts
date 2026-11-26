import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Only allow same-site relative redirects ("/foo"), never protocol-relative ("//evil.com"). */
export function safeNextPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined;
  return value;
}

/** Copies server-side `fieldErrors` from an ActionResult into React Hook Form. */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string[] | undefined> | undefined,
  fields: readonly string[],
) {
  if (!fieldErrors) return false;
  let applied = false;
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.length && fields.includes(key)) {
      setError(key as Path<T>, { type: "server", message: messages[0] });
      applied = true;
    }
  }
  return applied;
}
