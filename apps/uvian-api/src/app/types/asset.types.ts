export interface Asset {
  id: string;
  account_id: string;
  uploader_user_id: string | null;
  type: string;
  url: string;
  filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_type: 'supabase' | 'external';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  uploader_name?: string | null;
  uploader_avatar?: string | null;
  account_name?: string | null;
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
