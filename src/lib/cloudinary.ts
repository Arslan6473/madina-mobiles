import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/lib/env";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

let configured = false;
export function isCloudinaryConfigured() {
  const c = env.cloudinary;
  return !!(c.cloudName && c.apiKey && c.apiSecret);
}

function client() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Image uploads are not configured. Add CLOUDINARY_* variables to your environment.");
  }
  if (!configured) {
    const c = env.cloudinary;
    cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });
    configured = true;
  }
  return cloudinary;
}

/** Checks magic bytes so a renamed non-image can't slip through on its declared MIME type. */
function sniffImage(buf: Buffer): (typeof ALLOWED_TYPES)[number] | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavi")) return "image/avif";
  return null;
}

export async function uploadImage(file: File, subfolder: "products" | "categories" | "branding") {
  if (!(file instanceof File) || file.size === 0) throw new Error("No file provided.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image must be 5 MB or smaller.");
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number]))
    throw new Error("Only JPG, PNG, WebP or AVIF images are allowed.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(buffer)) throw new Error("File content is not a valid image.");

  const cld = client();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cld.uploader
      .upload_stream(
        {
          folder: `${env.cloudinary.folder}/${subfolder}`,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
          // Normalise oversized originals on ingest; delivery transformations handle the rest.
          transformation: [{ width: 2000, height: 2000, crop: "limit" }],
          overwrite: false,
          unique_filename: true,
        },
        (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)),
      )
      .end(buffer);
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string | undefined) {
  if (!publicId || !isCloudinaryConfigured()) return;
  // Only allow deleting assets inside this store's folder.
  if (!publicId.startsWith(`${env.cloudinary.folder}/`)) return;
  try {
    await client().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (e) {
    console.error("[cloudinary] delete failed", publicId, e);
  }
}
