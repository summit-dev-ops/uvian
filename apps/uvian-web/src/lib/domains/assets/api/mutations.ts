/**
 * Assets Domain Mutations
 *
 * TanStack Query mutationOptions for upload, create, and delete operations.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { createClient } from '~/lib/supabase/client';
import { assetsKeys } from './keys';
import type {
  AssetUI,
  UploadUrlResponse,
  ResolvedAsset,
  AssetType,
} from '../types';

type UploadAssetPayload = {
  file: File;
  type: AssetType;
};

type CreateAssetPayload = {
  type: AssetType;
  url: string;
  filename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

type DeleteAssetPayload = {
  assetId: string;
  hard?: boolean;
};

type ResolveAssetsPayload = {
  assetIds: string[];
};

type UploadAssetContext = {
  uploadUrl?: UploadUrlResponse;
};

type CreateAssetContext = {
  previousAssets?: AssetUI[];
};

export const assetsMutations = {
  /**
   * Get upload URL for a file.
   * This is the first step in the upload flow.
   */
  getUploadUrl: (
    queryClient: QueryClient
  ): MutationOptions<
    UploadUrlResponse,
    Error,
    { filename: string; contentType: string }
  > => ({
    mutationFn: async ({ filename, contentType }) => {
      const { data } = await apiClient.post<UploadUrlResponse>(
        '/api/assets/upload-url',
        { filename, contentType }
      );
      return data;
    },
  }),

  /**
   * Upload a file to Supabase Storage.
   * This is the second step - directly uploading to the storage URL.
   */
  uploadToStorage: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, { path: string; file: File }> => ({
    mutationFn: async ({ path, file }) => {
      const supabase = createClient();

      const { error } = await supabase.storage
        .from('assets')
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
    },
  }),

  /**
   * Create an asset record in the database.
   * This is the third step after successful upload.
   */
  createAsset: (
    queryClient: QueryClient
  ): MutationOptions<
    AssetUI,
    Error,
    CreateAssetPayload,
    CreateAssetContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AssetUI>('/api/assets', payload);
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
    },
  }),

  /**
   * Complete upload flow: get URL, upload to storage, create record.
   */
  uploadAsset: (
    queryClient: QueryClient
  ): MutationOptions<
    AssetUI,
    Error,
    UploadAssetPayload,
    UploadAssetContext
  > => ({
    mutationFn: async ({ file, type }) => {
      // Step 1: Get upload URL (path info) from API
      const { data: uploadUrlData } = await apiClient.post<UploadUrlResponse>(
        '/api/assets/upload-url',
        { filename: file.name, contentType: file.type }
      );

      // Step 2: Upload to Supabase Storage using the client
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(uploadUrlData.path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Step 3: Create asset record
      const { data: asset } = await apiClient.post<AssetUI>('/api/assets', {
        type,
        url: uploadUrlData.path,
        filename: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      return asset;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
    },
  }),

  /**
   * Delete an asset.
   */
  deleteAsset: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, DeleteAssetPayload> => ({
    mutationFn: async ({ assetId, hard }) => {
      const params = hard ? '?hard=true' : '';
      await apiClient.delete(`/api/assets/${assetId}${params}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetsKeys.lists() });
    },
  }),

  /**
   * Resolve asset IDs to signed URLs.
   */
  resolveAssets: (
    queryClient: QueryClient
  ): MutationOptions<ResolvedAsset[], Error, ResolveAssetsPayload> => ({
    mutationFn: async ({ assetIds }) => {
      const { data } = await apiClient.post<ResolvedAsset[]>(
        '/api/assets/resolve',
        { assetIds }
      );
      return data;
    },
  }),
};
