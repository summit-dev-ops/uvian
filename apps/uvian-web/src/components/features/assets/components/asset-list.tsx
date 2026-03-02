'use client';

import * as React from 'react';
import { Image, FileText, Trash2 } from 'lucide-react';
import { Button } from '@org/ui';
import { Skeleton } from '@org/ui';
import { Empty, EmptyTitle, EmptyDescription } from '@org/ui';
import { cn } from '@org/ui';
import type { AssetUI, AssetType } from '~/lib/domains/assets';

interface AssetListProps {
  assets: AssetUI[];
  onSelect?: (asset: AssetUI) => void;
  onDelete?: (assetId: string) => void;
  selectedAssetId?: string;
  isLoading?: boolean;
  className?: string;
}

function getAssetIcon(type: AssetType) {
  switch (type) {
    case 'image':
      return Image;
    case 'text':
    case 'document':
    default:
      return FileText;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetList({
  assets,
  onSelect,
  onDelete,
  selectedAssetId,
  isLoading = false,
  className,
}: AssetListProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <Empty className={className}>
        <EmptyTitle>No assets yet</EmptyTitle>
        <EmptyDescription>Upload a file to get started</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {assets.map((asset) => {
        const Icon = getAssetIcon(asset.type as AssetType);
        const isSelected = selectedAssetId === asset.id;

        return (
          <div
            key={asset.id}
            className={cn(
              'relative group flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:bg-muted'
            )}
            onClick={() => onSelect?.(asset)}
          >
            {asset.type === 'image' && asset.url ? (
              <img
                src={asset.url}
                alt={asset.filename || 'Image'}
                className="h-16 w-16 object-cover rounded"
                loading="lazy"
              />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center rounded bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
              {asset.filename || 'Untitled'}
            </p>
            <p className="text-xs text-muted-foreground/75">
              {formatFileSize(asset.fileSizeBytes)}
            </p>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(asset.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
