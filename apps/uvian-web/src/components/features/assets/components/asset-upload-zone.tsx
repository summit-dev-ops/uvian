'use client';

import * as React from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@org/ui';
import { Spinner } from '@org/ui';
import { cn } from '@org/ui';

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
];

const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.gif,.webp,.txt,.md';

interface AssetUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  className?: string;
}

export function AssetUploadZone({
  onFileSelect,
  isUploading = false,
  className,
}: AssetUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (ACCEPTED_TYPES.includes(file.type)) {
          setSelectedFile(file);
          if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
          }
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (ACCEPTED_TYPES.includes(file.type)) {
          setSelectedFile(file);
          if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
          }
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleClear = React.useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (selectedFile) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center p-4 rounded-lg border bg-muted/50',
          className
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={selectedFile.name}
            className="max-h-32 max-w-full object-contain rounded"
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            {selectedFile.name}
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Spinner className="h-4 w-4" />
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6"
          onClick={handleClear}
          disabled={isUploading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center">
        <span className="font-medium text-foreground">Click to upload</span> or
        drag and drop
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PNG, JPG, GIF, WEBP or TXT, MD (max 10MB)
      </p>
    </div>
  );
}
