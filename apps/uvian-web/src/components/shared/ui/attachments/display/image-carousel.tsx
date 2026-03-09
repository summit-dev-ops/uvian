'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselApi,
  useIsMobile,
} from '@org/ui';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@org/ui';

interface ImageCarouselProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ImageCarouselMobile({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageCarouselProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initialIndex);

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

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };
  console.log(current)
  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />
        <div className="fixed inset-0 z-[100] w-full h-[100dvh] bg-black">
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

            <Carousel setApi={setApi} opts={{ startIndex: initialIndex }}>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    {!loadedImages.has(index) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    <img
                      src={image.url}
                      alt={image.alt || 'Image'}
                      className={`my-auto object-contain transition-opacity duration-200 ${
                        loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ height: '100dvh' }}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageLoad(index)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-black/50 hover:bg-black/70 border-none text-white h-8 w-8" />
              <CarouselNext className="right-4 bg-black/50 hover:bg-black/70 border-none text-white h-8 w-8" />
            </Carousel>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

function ImageCarouselDesktop({
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

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />

        <div className="fixed left-[50%] top-[50%] z-[100] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] p-0 bg-transparent border-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <DialogTitle className="sr-only">Image carousel</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            <Carousel
              className="w-full max-w-4xl"
              opts={{ startIndex: initialIndex }}
            >
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative flex items-center justify-center p-4 h-full">
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
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 bg-black/50 hover:bg-black/70 border-none text-white h-8 w-8" />
                  <CarouselNext className="right-4 bg-black/50 hover:bg-black/70 border-none text-white h-8 w-8" />
                </>
              )}
            </Carousel>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

export function ImageCarousel({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageCarouselProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <ImageCarouselMobile
      images={images}
      initialIndex={initialIndex}
      open={open}
      onOpenChange={onOpenChange}
    />
  ) : (
    <ImageCarouselDesktop
      images={images}
      initialIndex={initialIndex}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
