export interface Asset {
  id: string;
  accountId: string;
  uploaderUserId: string | null;
  type: string;
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

export interface CreateAssetInput {
  type: string;
  url: string;
  filename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageType?: 'supabase' | 'external';
  metadata?: Record<string, unknown>;
}

export interface AssetPagination {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AssetScopedService {
  getAssets(options?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{ assets: Asset[]; pagination: AssetPagination }>;
  getAsset(assetId: string): Promise<Asset>;
  getAssetById(assetId: string): Promise<Asset | null>;
  createAsset(userId: string, input: CreateAssetInput): Promise<Asset>;
  deleteAsset(
    userId: string,
    assetId: string,
    hardDelete?: boolean
  ): Promise<{ success: boolean }>;
  getUploadUrl(
    userId: string,
    filename: string,
    contentType: string
  ): Promise<{
    path: string;
    filename: string;
    contentType: string;
    uploadUrl: string;
  }>;
  resolveAssets(assetIds: string[]): Promise<{ id: string; url: string }[]>;
  getAccountStorageUsage(accountId: string): Promise<{
    accountId: string;
    usedBytes: number;
    usedMB: number;
    usedGB: number;
    assetCount: number;
  }>;
  resolveAssetByUrl(storagePath: string): Promise<{
    url: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    filename: string | null;
  } | null>;
}

export interface AssetAdminService {
  // Placeholder for future admin-only methods
}

export interface CreateAssetServiceConfig {}
