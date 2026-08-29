"use client";

import { useState } from "react";

type ImageData = {
  id: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: ImageData[];
  productName: string;
}) {
  const [activeImage, setActiveImage] = useState(
    images.find((i) => i.isPrimary)?.imageUrl ?? images[0]?.imageUrl ?? ""
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
        <img
          src={activeImage}
          alt={productName}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setActiveImage(img.imageUrl)}
              className={`relative aspect-square overflow-hidden rounded-md border bg-muted transition-all ${
                activeImage === img.imageUrl
                  ? "ring-2 ring-primary border-primary"
                  : "hover:ring-2 hover:ring-primary/50"
              }`}
            >
              <img
                src={img.imageUrl}
                alt={img.altText ?? productName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
