'use client';

import { X } from 'lucide-react';
import { Button } from '@org/ui';
import React from 'react';

export interface AttachmentChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact';
  onRemove?: () => void;
  className?: string;
}

export function AttachmentChip({
  children,
  variant = 'default',
  onRemove,
  className = '',
}: AttachmentChipProps) {
  const baseClasses =
    variant === 'compact'
      ? 'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs'
      : 'inline-flex items-center gap-2 px-2 py-1 text-sm';

  return (
    <span
      className={`${baseClasses} bg-secondary rounded-md hover:bg-secondary/80 transition-colors ${className}`}
    >
      {children}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className={variant === 'compact' ? 'h-2 w-2' : 'h-3 w-3'} />
        </Button>
      )}
    </span>
  );
}
