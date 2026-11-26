"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageDTO } from "@/types";

export function ProductGallery({ images, name, badge }: { images: ImageDTO[]; name: string; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-12" />
          </div>
        )}
        {badge && <div className="absolute top-4 left-4 flex flex-col gap-1.5">{badge}</div>}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 bg-muted transition",
                i === active ? "border-royal" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
