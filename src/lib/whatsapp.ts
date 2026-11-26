import { formatPrice, toInternationalPhone, type CurrencyConfig } from "@/lib/format";

/**
 * WhatsApp click-to-chat helpers. These only build `https://wa.me/...` links;
 * the customer is redirected to WhatsApp and sends the message themselves.
 */

const GREETING = "Assalam o Alaikum";

export function whatsappLink(phone: string, message?: string) {
  const number = toInternationalPhone(phone);
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function generalInquiryMessage(storeName: string) {
  return `${GREETING}, I have a question about products at ${storeName}.`;
}

export function productInquiryMessage(product: { name: string; variantLabel?: string; url?: string }) {
  const name = product.variantLabel ? `${product.name} (${product.variantLabel})` : product.name;
  let msg = `${GREETING}, I want to inquire about ${name}. Is it available?`;
  if (product.url) msg += `\n${product.url}`;
  return msg;
}

export type WhatsAppLine = { name: string; variantLabel?: string; quantity: number; unitPrice: number };

export function cartMessage(lines: WhatsAppLine[], total: number, currency?: CurrencyConfig) {
  const items = lines
    .map((l, i) => {
      const name = l.variantLabel ? `${l.name} (${l.variantLabel})` : l.name;
      return `${i + 1}. ${name} x ${l.quantity} = ${formatPrice(l.unitPrice * l.quantity, currency)}`;
    })
    .join("\n");
  return `${GREETING}, I would like to order these products:\n${items}\nTotal: ${formatPrice(total, currency)}.`;
}

export function orderMessage(
  order: {
    orderNumber: string;
    customerName?: string;
    items?: WhatsAppLine[];
    total?: number;
    city?: string;
  },
  currency?: CurrencyConfig,
) {
  let msg = `${GREETING}, I have placed order #${order.orderNumber}. I would like to confirm my order.`;
  if (order.items?.length) {
    msg +=
      "\n\nItems:\n" +
      order.items
        .map((l) => `- ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} x ${l.quantity}`)
        .join("\n");
  }
  if (order.total !== undefined) msg += `\nTotal: ${formatPrice(order.total, currency)} (Cash on Delivery)`;
  if (order.customerName) msg += `\nName: ${order.customerName}`;
  if (order.city) msg += `\nCity: ${order.city}`;
  return msg;
}
