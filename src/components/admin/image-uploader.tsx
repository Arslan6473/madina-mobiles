"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Info, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discardUploadAction, uploadImageAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ImageDTO } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Controlled multi-image uploader backed by `uploadImageAction`.
 * Images uploaded in this session and then removed before saving are discarded from Cloudinary.
 * When Cloudinary isn't configured, images can be added by URL (Cloudinary https URL or a local /path).
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 10,
  cloudinaryEnabled,
  showAlt = true,
  invalid,
}: {
  value: ImageDTO[];
  onChange: (images: ImageDTO[]) => void;
  folder: "products" | "categories" | "branding";
  max?: number;
  cloudinaryEnabled: boolean;
  showAlt?: boolean;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fresh = useRef(new Set<string>());
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const remaining = max - value.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (files.length > list.length) toast.warning(`Only ${max} image${max === 1 ? "" : "s"} allowed.`);
    const valid = list.filter((f) => {
      if (!ACCEPT.split(",").includes(f.type)) {
        toast.error(`${f.name}: only JPG, PNG, WebP or AVIF images are allowed.`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    });
    setUploading((n) => n + valid.length);
    for (const file of valid) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      try {
        const res = await uploadImageAction(fd);
        if (!res.ok) {
          toast.error(res.error);
        } else {
          if (res.data.publicId) fresh.current.add(res.data.publicId);
          const next = [...latest.current, { ...res.data, alt: "" }];
          latest.current = next;
          onChange(next);
        }
      } catch {
        toast.error(`Upload of ${file.name} failed.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function addByUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https:\/\//.test(url) && !url.startsWith("/")) {
      toast.error("Use an https:// URL or a site path starting with /");
      return;
    }
    if (remaining <= 0) return;
    onChange([...value, { url, alt: "" }]);
    setUrlInput("");
  }

  function remove(i: number) {
    const img = value[i];
    onChange(value.filter((_, idx) => idx !== i));
    if (img.publicId && fresh.current.has(img.publicId)) {
      fresh.current.delete(img.publicId);
      void discardUploadAction(img.publicId);
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function setAlt(i: number, alt: string) {
    onChange(value.map((img, idx) => (idx === i ? { ...img, alt } : img)));
  }

  return (
    <div className="grid gap-3">
      {!cloudinaryEnabled && (
        <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Image uploads are not configured.</strong> Add the <code>CLOUDINARY_*</code> environment variables to
            enable uploads. Meanwhile you can add an image by URL (an https link or a path like <code>/demo/earbuds.svg</code>).
          </p>
        </div>
      )}

      {value.length > 0 && (
        <ul className={cn("grid gap-3", max > 1 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "max-w-[14rem]")}>
          {value.map((img, i) => (
            <li key={`${img.publicId ?? img.url}-${i}`} className="overflow-hidden rounded-xl border bg-card">
              <div className="relative aspect-square bg-muted">
                <Image src={img.url} alt={img.alt || ""} fill sizes="200px" className="object-contain p-1" />
                {i === 0 && max > 1 && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Star className="size-3 fill-yellow-brand text-yellow-brand" /> Main
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 border-t p-1.5">
                {max > 1 ? (
                  <div className="flex">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move right"
                      disabled={i === value.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                ) : (
                  <span />
                )}
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove image" className="text-destructive" onClick={() => remove(i)}>
                  <Trash2 />
                </Button>
              </div>
              {showAlt && (
                <div className="border-t p-1.5">
                  <Input
                    value={img.alt ?? ""}
                    onChange={(e) => setAlt(i, e.target.value)}
                    placeholder="Alt text"
                    aria-label={`Alt text for image ${i + 1}`}
                    maxLength={200}
                    className="h-7 text-xs"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {cloudinaryEnabled && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple={max > 1}
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                tabIndex={-1}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading > 0}
                aria-invalid={invalid || undefined}
                className="h-auto justify-start border-dashed px-4 py-3"
              >
                {uploading > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                <span className="text-left">
                  <span className="block font-medium">{uploading > 0 ? `Uploading ${uploading}…` : "Upload image" + (max > 1 ? "s" : "")}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    JPG, PNG, WebP or AVIF · max 5 MB{max > 1 ? ` · ${remaining} left` : ""}
                  </span>
                </span>
              </Button>
            </>
          )}
          {!cloudinaryEnabled && (
            <div className="flex w-full gap-2 sm:max-w-md">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addByUrl();
                    }
                  }}
                  placeholder="https://… or /demo/image.svg"
                  aria-label="Image URL"
                  aria-invalid={invalid || undefined}
                  className="h-9 pl-8"
                />
              </div>
              <Button type="button" variant="outline" className="h-9" onClick={addByUrl}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
