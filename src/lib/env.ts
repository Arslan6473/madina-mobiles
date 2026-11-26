import "server-only";

const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  get MONGODB_URI() {
    return required("MONGODB_URI", "mongodb://127.0.0.1:27017/madina-mobile-gadgets");
  },
  get AUTH_SECRET() {
    const secret = required("AUTH_SECRET", "dev-only-insecure-secret-change-me-0123456789");
    if (secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
    return secret;
  },
  get cloudinary() {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
      apiKey: process.env.CLOUDINARY_API_KEY ?? "",
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
      folder: process.env.CLOUDINARY_FOLDER ?? "madina-mobile-gadgets",
    };
  },
  get smtp() {
    return {
      host: process.env.SMTP_HOST ?? "",
      port: Number(process.env.SMTP_PORT ?? 587),
      user: process.env.SMTP_USER ?? "",
      password: process.env.SMTP_PASSWORD ?? "",
      from: process.env.EMAIL_FROM ?? "Madina Mobile Gadgets <no-reply@example.com>",
    };
  },
  isProd,
};

export { siteUrl } from "./site";
