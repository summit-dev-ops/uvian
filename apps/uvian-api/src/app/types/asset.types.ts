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

export interface AssetWithUploadUrl {
  asset: Asset;
  uploadUrl: string;
}

export interface GetAssetsQuery {
  page?: number;
  limit?: number;
  type?: string;
}

export interface CreateAssetRequest {
  Body: CreateAssetInput;
}

export interface GetAssetRequest {
  Params: {
    assetId: string;
  };
}

export interface DeleteAssetRequest {
  Params: {
    assetId: string;
  };
  Querystring?: {
    hard?: string;
  };
}

export interface GetUploadUrlRequest {
  Body: {
    filename: string;
    contentType: string;
  };
}

export interface ResolveAssetsRequest {
  Body: {
    assetIds: string[];
  };
}

export interface UploadAssetRequest {
  Body: {
    type: string;
    filename: string;
    mimeType: string;
    fileSizeBytes: number;
  };
}

export interface UploadAssetResponse {
  asset: Asset;
  uploadUrl: string;
}
