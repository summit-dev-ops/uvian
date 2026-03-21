import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import type { Asset, CreateAssetInput } from '../types/asset.types';

export class AssetService {
  async getAssets(
    userClient: SupabaseClient,
    options: { page?: number; limit?: number; type?: string } = {}
  ) {
    const { page = 1, limit = 20, type } = options;
    const offset = (page - 1) * limit;

    let query = userClient
      .schema('core_hub')
      .from('get_my_assets')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      assets: (data || []).map(this.transformFromDatabase),
      pagination: {
        total: count || 0,
        page,
        limit,
        hasMore: offset + (data?.length || 0) < (count || 0),
      },
    };
  }

  async getAsset(userClient: SupabaseClient, assetId: string) {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_asset_details')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error || !data) {
      throw new Error('Asset not found');
    }

    return this.transformFromDatabase(data);
  }

  async getAssetById(assetId: string): Promise<Asset | null> {
    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformFromDatabase(data);
  }

  async createAsset(userId: string, input: CreateAssetInput) {
    // Derive accountId from current user using admin client
    const { data: accountData, error: accountError } = await adminSupabase.rpc(
      'get_account_id_for_user',
      { target_user_id: userId }
    );

    if (accountError || !accountData) {
      throw new Error('Could not determine user account');
    }

    const accountId = accountData;

    // Convert storage path to full public URL for permanent access
    const publicUrl = this.getPublicUrl(input.url);

    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('assets')
      .insert({
        account_id: accountId,
        uploader_user_id: userId,
        type: input.type,
        url: publicUrl,
        filename: input.filename,
        mime_type: input.mimeType,
        file_size_bytes: input.fileSizeBytes,
        storage_type: input.storageType || 'supabase',
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.transformFromDatabase(data);
  }

  async deleteAsset(
    userClient: SupabaseClient,
    userId: string,
    assetId: string,
    hardDelete = false
  ) {
    // First get the asset to check permissions
    const { data: asset, error: fetchError } = await userClient
      .schema('core_hub')
      .from('get_asset_details')
      .select('*, account_id')
      .eq('id', assetId)
      .single();

    if (fetchError || !asset) {
      throw new Error('Asset not found');
    }

    // Check if user can delete this asset
    // User can delete if:
    // 1. They uploaded it (uploader_user_id = userId)
    // 2. They are an admin/owner of the account
    const isUploader = asset.uploader_user_id === userId;

    // Check account role
    const { data: membership } = await userClient
      .from('account_members')
      .select('role')
      .eq('account_id', asset.account_id)
      .eq('user_id', userId)
      .single();

    const role = membership?.role?.name;
    const isAccountAdmin = role === 'owner' || role === 'admin';

    if (!isUploader && !isAccountAdmin) {
      throw new Error('Insufficient permissions to delete this asset');
    }

    if (hardDelete && !isAccountAdmin) {
      throw new Error('Only account admins can hard delete assets');
    }

    if (hardDelete) {
      // Hard delete: remove from storage and database
      const storagePath = this.extractStoragePath(asset.url);
      if (storagePath && asset.storageType === 'supabase') {
        await adminSupabase.storage.from('assets').remove([storagePath]);
      }

      const { error } = await adminSupabase
        .schema('core_hub')
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      // Soft delete: just remove the row (file remains orphaned)
      const { error } = await adminSupabase
        .schema('core_hub')
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) {
        throw new Error(error.message);
      }
    }

    return { success: true };
  }

  async getUploadUrl(userId: string, filename: string, contentType: string) {
    // Derive accountId from current user using admin client
    const { data: accountId, error: accountError } = await adminSupabase.rpc(
      'get_account_id_for_user',
      { target_user_id: userId }
    );

    if (accountError || !accountId) {
      throw new Error('Could not determine user account');
    }

    // Generate unique filename
    const uniqueId = crypto.randomUUID();
    const ext = filename.split('.').pop() || '';
    const storageFilename = `${uniqueId}${ext ? '.' + ext : ''}`;
    const storagePath = `accounts/${accountId}/${storageFilename}`;

    // Build full URL for POST upload
    const supabaseUrl = process.env.SUPABASE_URL?.replace('https://', '');
    const fullUrl = `https://${supabaseUrl}/storage/v1/object/assets/${storagePath}`;

    return {
      path: storagePath,
      filename: storageFilename,
      contentType,
      uploadUrl: fullUrl,
    };
  }

  private getPublicUrl(storagePath: string): string {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }
    return `${supabaseUrl}/storage/v1/object/public/assets/${storagePath}`;
  }

  async resolveAssets(assetIds: string[]) {
    if (!assetIds || assetIds.length === 0) {
      return [];
    }

    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('assets')
      .select('id, url, storage_type, account_id')
      .in('id', assetIds);

    if (error) {
      throw new Error(error.message);
    }

    const resolved = await Promise.all(
      (data || []).map(async (asset: any) => {
        let accessUrl = asset.url;

        if (asset.storage_type === 'supabase') {
          // Generate signed URL for private assets
          const { data: signedData } = await adminSupabase.storage
            .from('assets')
            .createSignedUrl(asset.url, 3600); // 1 hour

          accessUrl = signedData?.signedUrl || asset.url;
        }

        return {
          id: asset.id,
          url: accessUrl,
        };
      })
    );

    return resolved;
  }

  async getAccountStorageUsage(accountId: string) {
    const { data, error } = await adminSupabase
      .schema('core_hub')
      .from('assets')
      .select('file_size_bytes')
      .eq('account_id', accountId);

    if (error) {
      throw new Error(error.message);
    }

    const totalBytes = (data || []).reduce(
      (sum: number, asset: any) => sum + (asset.file_size_bytes || 0),
      0
    );

    return {
      accountId,
      usedBytes: totalBytes,
      usedMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
      usedGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 1000) / 1000,
      assetCount: data?.length || 0,
    };
  }

  async resolveAssetByUrl(storagePath: string): Promise<{
    url: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    filename: string | null;
  } | null> {
    if (!storagePath || !storagePath.startsWith('accounts/')) {
      return null;
    }

    const { data: asset, error }: any = await adminSupabase
      .schema('core_hub')
      .from('assets')
      .select('url, mime_type, file_size_bytes, storage_type, filename')
      .eq('url', storagePath)
      .single();

    if (error || !asset) {
      return null;
    }

    let accessUrl = asset.url;

    if (asset.storage_type === 'supabase') {
      const { data: signedData } = await adminSupabase.storage
        .from('assets')
        .createSignedUrl(asset.url, 3600);

      accessUrl = signedData?.signedUrl || asset.url;
    }

    return {
      url: accessUrl,
      mimeType: asset.mime_type,
      fileSizeBytes: asset.file_size_bytes,
      filename: asset.filename,
    };
  }

  private extractStoragePath(url: string): string | null {
    // If it's a Supabase storage path (not a full URL), return as-is
    if (url.startsWith('accounts/')) {
      return url;
    }
    // If it's a full Supabase storage URL, extract the path
    if (url.includes('/storage/v1/object/files/')) {
      return url.split('/storage/v1/object/files/')[1];
    }
    return null;
  }

  private transformFromDatabase(record: any): Asset {
    return {
      id: record.id,
      accountId: record.account_id,
      uploaderUserId: record.uploader_user_id,
      type: record.type,
      url: record.url,
      filename: record.filename,
      mimeType: record.mime_type,
      fileSizeBytes: record.file_size_bytes,
      storageType: record.storage_type,
      metadata: record.metadata,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      uploaderName: record.uploader_name,
      uploaderAvatar: record.uploader_avatar,
      accountName: record.account_name,
    };
  }
}

export const assetService = new AssetService();
