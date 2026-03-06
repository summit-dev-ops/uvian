'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@org/ui';
import { FileText } from 'lucide-react';
import { assetsQueries } from '~/lib/domains/assets/api';
import { FileChips } from '~/components/shared/ui/attachments/display';
import type { FileAttachment } from '~/lib/domains/shared/attachments/types';

interface AssetPostItemProps {
  assetId: string;
  maxLines?: number;
}

export function AssetPostItem({ assetId }: AssetPostItemProps) {
  const { data: asset, isLoading } = useQuery(assetsQueries.detail(assetId));

  if (isLoading) {
    return <AssetPostItemSkeleton />;
  }

  if (!asset) {
    return (
      <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
        <FileText className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Asset not found</span>
      </div>
    );
  }

  const isImage = asset.mimeType?.startsWith('image/');

  if (isImage) {
    return (
      <img
        src={asset.url}
        alt={asset.filename || 'Image'}
        className="max-w-xs max-h-48 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }

  const attachment: FileAttachment = {
    type: 'file',
    key: asset.url,
    url: asset.url,
    filename: asset.filename || undefined,
    mimeType: asset.mimeType || undefined,
    size: asset.fileSizeBytes || undefined,
  };

  return <FileChips files={[attachment]} />;
}

export function AssetPostItemSkeleton() {
  return (
    <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
