'use client';

import { useState } from 'react';
import { ImageCarousel } from './image-carousel';
import type { FileAttachment } from '~/lib/domains/shared/attachments/types';

interface ImageGalleryProps {
  images: FileAttachment[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setCarouselIndex(index);
    setCarouselOpen(true);
  };

  const imageUrls = images.map((img) => ({
    url: img.url,
    alt: img.filename || 'Image',
  }));

  if (images.length === 1) {
    return (
      <>
        <div className="mt-2">
          <img
            src={images[0].url}
            alt={images[0].filename || 'Image'}
            className="w-full md:max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => handleImageClick(0)}
          />
        </div>
        <ImageCarousel
          images={imageUrls}
          initialIndex={carouselIndex}
          open={carouselOpen}
          onOpenChange={setCarouselOpen}
        />
      </>
    );
  }

  if (images.length === 2) {
    return (
      <>
        <div className="mt-2 flex gap-2">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.url}
              alt={image.filename || 'Image'}
              className="w-1/2 aspect-square rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => handleImageClick(index)}
            />
          ))}
        </div>
        <ImageCarousel
          images={imageUrls}
          initialIndex={carouselIndex}
          open={carouselOpen}
          onOpenChange={setCarouselOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {images.slice(0, 3).map((image, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.url}
              alt={image.filename || 'Image'}
              className="w-full h-full rounded-lg object-cover hover:opacity-90 transition-opacity"
              loading="lazy"
            />
            {index === 2 && images.length > 3 && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{images.length - 3}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <ImageCarousel
        images={imageUrls}
        initialIndex={carouselIndex}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
      />
    </>
  );
}
