"use client";

/**
 * Custom next/image loader.
 * - Cloudinary URLs get on-the-fly transformations (auto format, auto quality, responsive width).
 * - Local/other images are served as-is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const q = quality ? `q_${quality}` : "q_auto";
    return src.replace("/upload/", `/upload/f_auto,${q},c_limit,w_${width}/`);
  }
  if (src.startsWith("/")) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  return src;
}
