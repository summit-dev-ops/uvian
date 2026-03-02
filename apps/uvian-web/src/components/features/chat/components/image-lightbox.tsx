'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@org/ui';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@org/ui';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  src,
  alt = 'Image',
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, src]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [open, onOpenChange]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-16 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10"
              onClick={handleDownload}
            >
              <Download className="h-5 w-5" />
            </Button>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            {error ? (
              <div className="text-white text-center p-8">
                <p className="text-lg">Failed to load image</p>
                <p className="text-sm text-white/60 mt-2">{src}</p>
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                className={`max-w-[90vw] max-h-[85vh] object-contain transition-opacity duration-200 ${
                  loading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
