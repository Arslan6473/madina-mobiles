export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Statuses that make up the normal (non-cancelled) delivery timeline. */
export const ORDER_TIMELINE: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export const PAYMENT_METHODS = ["cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
};

export const INQUIRY_STATUSES = ["new", "read", "resolved"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_SORTS = {
  newest: "Newest",
  popular: "Most popular",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_QTY_PER_LINE = 100;

export const PK_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const SESSION_COOKIE = "mmg_session";
