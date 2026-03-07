'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@org/ui';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@org/ui';

interface ImageCarouselProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageCarousel({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageCarouselProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setLoadedImages(new Set());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [open, handleKeyDown]);

  const handleDownload = (url: string, alt?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Image carousel</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <Carousel className="w-full max-w-4xl">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="flex items-center justify-center p-4">
                      {!loadedImages.has(index) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                      <img
                        src={image.url}
                        alt={image.alt || 'Image'}
                        className={`max-h-[80vh] max-w-full object-contain transition-opacity duration-200 ${
                          loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageLoad(index)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
                        onClick={() => handleDownload(image.url, image.alt)}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 bg-black/50 hover:bg-black/70 border-none text-white" />
                  <CarouselNext className="right-4 bg-black/50 hover:bg-black/70 border-none text-white" />
                </>
              )}
            </Carousel>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
