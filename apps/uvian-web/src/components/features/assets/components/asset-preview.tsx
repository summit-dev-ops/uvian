'use client';

import * as React from 'react';
import { X, Link } from 'lucide-react';
import { Button } from '@org/ui';
import { cn } from '@org/ui';
import type { AssetUI } from '~/lib/domains/assets';

interface AssetPreviewProps {
  asset: AssetUI;
  onRemove?: () => void;
  onCopyUrl?: () => void;
  className?: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetPreview({
  asset,
  onRemove,
  onCopyUrl,
  className,
}: AssetPreviewProps) {
  const isImage =
    asset.type === 'image' || asset.mimeType?.startsWith('image/');

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-lg border bg-muted/50',
        className
      )}
    >
      {isImage && asset.url ? (
        <img
          src={asset.url}
          alt={asset.filename || 'Image'}
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        <div className="h-10 w-10 flex items-center justify-center rounded bg-muted">
          <span className="text-xs font-medium">
            {asset.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{asset.filename || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(asset.fileSizeBytes)}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {onCopyUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCopyUrl}
            title="Copy URL"
          >
            <Link className="h-3 w-3" />
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRemove}
            title="Remove"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
