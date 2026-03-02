/**
 * Assets Domain Types
 *
 * Defines UI types for the asset management system.
 */

export type AssetType = 'image' | 'text' | 'document';

export interface AssetUI {
  id: string;
  accountId: string;
  uploaderUserId: string | null;
  type: AssetType;
  url: string;
  filename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storageType: 'supabase' | 'external';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  uploaderName?: string | null;
  uploaderAvatar?: string | null;
  accountName?: string | null;
}

export interface AssetDraft {
  file?: File;
  previewUrl?: string;
  assetId?: string;
  url?: string;
  type?: AssetType;
  filename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}

export interface AssetListResponse {
  assets: AssetUI[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface UploadUrlResponse {
  path: string;
  filename: string;
  contentType: string;
  uploadUrl: string;
}

export interface ResolvedAsset {
  id: string;
  url: string;
}

export type AssetFilter = {
  type?: AssetType;
  page?: number;
  limit?: number;
};
