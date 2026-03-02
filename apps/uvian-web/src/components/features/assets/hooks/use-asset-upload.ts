/**
 * Asset Upload Hook
 *
 * Provides a simple interface for uploading assets.
 */

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsMutations } from '~/lib/domains/assets';
import type { AssetUI, AssetType } from '~/lib/domains/assets';

interface UseAssetUploadOptions {
  onSuccess?: (asset: AssetUI) => void;
  onError?: (error: Error) => void;
}

export function useAssetUpload(options?: UseAssetUploadOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...assetsMutations.uploadAsset(queryClient),
    onSuccess: (asset) => {
      options?.onSuccess?.(asset);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  const upload = React.useCallback(
    async (file: File, type?: AssetType) => {
      const assetType = type || getAssetType(file.type);
      return mutation.mutateAsync({ file, type: assetType });
    },
    [mutation]
  );

  return {
    upload,
    isUploading: mutation.isPending,
    error: mutation.error,
  };
}

function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('text/')) return 'text';
  return 'document';
}
