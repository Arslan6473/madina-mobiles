/** Client- and server-safe formatting helpers. Locale defaults target Pakistan but are parameterised. */

export type CurrencyConfig = { currency: string; currencySymbol: string; locale?: string };

export const DEFAULT_CURRENCY: CurrencyConfig = { currency: "PKR", currencySymbol: "Rs.", locale: "en-PK" };

export function formatPrice(amount: number, cfg: CurrencyConfig = DEFAULT_CURRENCY) {
  const value = new Intl.NumberFormat(cfg.locale ?? "en-PK", { maximumFractionDigits: 0 }).format(
    Math.round(amount),
  );
  return `${cfg.currencySymbol} ${value}`;
}

export function formatDate(value: string | Date, withTime = false) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/**
 * Normalises a Pakistani phone number to international digits (e.g. "0301-6597269" -> "923016597269").
 * Numbers already in international form are returned as digits only.
 */
export function toInternationalPhone(phone: string, countryCode = "92") {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return countryCode + digits.slice(1);
  if (digits.length === 10 && digits.startsWith("3")) return countryCode + digits;
  return digits;
}

/** Display format for a Pakistani mobile, e.g. "0301-6597269". */
export function formatPhone(phone: string) {
  const intl = toInternationalPhone(phone);
  if (intl.startsWith("92") && intl.length === 12) {
    const local = "0" + intl.slice(2);
    return `${local.slice(0, 4)}-${local.slice(4)}`;
  }
  return phone;
}

/** Accepts 03XXXXXXXXX, 3XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX (spaces/dashes allowed). */
export const PK_MOBILE_REGEX = /^(?:\+?92|0)?3\d{2}[-\s]?\d{7}$/;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, salePrice?: number | null) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
