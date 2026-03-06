'use client';

import { useState } from 'react';
import { ImageCarousel } from '../../../../features/chat/components/image-carousel';
import type { FileAttachment } from '~/lib/domains/shared/attachments/types';

interface ImageChipsProps {
  images: FileAttachment[];
}

export function ImageChips({ images }: ImageChipsProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setCarouselIndex(index);
    setCarouselOpen(true);
  };

  const carouselImages = images.map((img) => ({
    url: img.url,
    alt: img.filename || 'Image',
  }));

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {images.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            onClick={() => handleImageClick(index)}
            className="inline-flex items-center gap-2 px-2 py-1 bg-secondary rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            <img
              src={image.url}
              alt={image.filename || 'Image'}
              className="w-6 h-6 rounded object-cover shrink-0"
              loading="lazy"
            />
            <span className="truncate max-w-[150px]">
              {image.filename || 'Image'}
            </span>
          </button>
        ))}
      </div>
      <ImageCarousel
        images={carouselImages}
        initialIndex={carouselIndex}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
      />
    </>
  );
}
