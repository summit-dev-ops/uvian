'use client';

import * as React from 'react';
import { ImageCarousel } from '../../attachments/display/image-carousel';
import type { FileAttachment } from '~/lib/domains/shared/attachments/types';

export interface ImageCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: FileAttachment[];
  initialIndex?: number;
}

export function ImageCarouselModal({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
}: ImageCarouselModalProps) {
  const imageUrls = React.useMemo(
    () =>
      images.map((img) => ({
        url: img.url,
        alt: img.filename || 'Image',
      })),
    [images]
  );

  return (
    <ImageCarousel
      images={imageUrls}
      initialIndex={initialIndex}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
