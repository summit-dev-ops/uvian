import { ServiceClients } from '../types';
import {
  AssetScopedService,
  Asset,
  AssetPagination,
  CreateAssetInput,
} from './types';

export function createAssetScopedService(
  clients: ServiceClients
): AssetScopedService {
  return {
    async getAssets(
      options: { page?: number; limit?: number; type?: string } = {}
    ): Promise<{ assets: Asset[]; pagination: AssetPagination }> {
      const { page = 1, limit = 20, type } = options;
      const offset = (page - 1) * limit;

      let query = clients.userClient
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
        assets: (data || []).map(transformFromDatabase),
        pagination: {
          total: count || 0,
          page,
          limit,
          hasMore: offset + (data?.length || 0) < (count || 0),
        },
      };
    },

    async getAsset(assetId: string): Promise<Asset> {
      const { data, error } = await clients.userClient
        .schema('core_hub')
        .from('get_asset_details')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error || !data) {
        throw new Error('Asset not found');
      }

      return transformFromDatabase(data);
    },

    async getAssetById(assetId: string): Promise<Asset | null> {
      const { data, error } = await clients.userClient
        .schema('core_hub')
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error || !data) {
        return null;
      }

      return transformFromDatabase(data);
    },

    async createAsset(userId: string, input: CreateAssetInput): Promise<Asset> {
      const { data: accountData, error: accountError } =
        await clients.adminClient.rpc('get_account_id_for_user', {
          target_user_id: userId,
        });

      if (accountError || !accountData) {
        throw new Error('Could not determine user account');
      }

      const accountId = accountData;

      const publicUrl = getPublicUrl(input.url);

      const { data, error } = await clients.adminClient
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

      return transformFromDatabase(data);
    },

    async deleteAsset(
      userId: string,
      assetId: string,
      hardDelete = false
    ): Promise<{ success: boolean }> {
      const { data: asset, error: fetchError } = await clients.userClient
        .schema('core_hub')
        .from('get_asset_details')
        .select('*, account_id')
        .eq('id', assetId)
        .single();

      if (fetchError || !asset) {
        throw new Error('Asset not found');
      }

      const isUploader = asset.uploader_user_id === userId;

      const { data: membership } = await clients.userClient
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
        const storagePath = extractStoragePath(asset.url);
        if (storagePath && asset.storage_type === 'supabase') {
          await clients.adminClient.storage
            .from('assets')
            .remove([storagePath]);
        }

        const { error } = await clients.adminClient
          .schema('core_hub')
          .from('assets')
          .delete()
          .eq('id', assetId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await clients.adminClient
          .schema('core_hub')
          .from('assets')
          .delete()
          .eq('id', assetId);

        if (error) {
          throw new Error(error.message);
        }
      }

      return { success: true };
    },

    async getUploadUrl(
      userId: string,
      filename: string,
      contentType: string
    ): Promise<{
      path: string;
      filename: string;
      contentType: string;
      uploadUrl: string;
    }> {
      const { data: accountId, error: accountError } =
        await clients.adminClient.rpc('get_account_id_for_user', {
          target_user_id: userId,
        });

      if (accountError || !accountId) {
        throw new Error('Could not determine user account');
      }

      const uniqueId = crypto.randomUUID();
      const ext = filename.split('.').pop() || '';
      const storageFilename = `${uniqueId}${ext ? '.' + ext : ''}`;
      const storagePath = `accounts/${accountId}/${storageFilename}`;

      const supabaseUrl = process.env.SUPABASE_URL?.replace('https://', '');
      const fullUrl = `https://${supabaseUrl}/storage/v1/object/assets/${storagePath}`;

      return {
        path: storagePath,
        filename: storageFilename,
        contentType,
        uploadUrl: fullUrl,
      };
    },

    async resolveAssets(
      assetIds: string[]
    ): Promise<{ id: string; url: string }[]> {
      if (!assetIds || assetIds.length === 0) {
        return [];
      }

      const { data, error } = await clients.userClient
        .schema('core_hub')
        .from('assets')
        .select('id, url, storage_type, account_id')
        .in('id', assetIds);

      if (error) {
        throw new Error(error.message);
      }

      const resolved = await Promise.all(
        (data || []).map(async (asset: Record<string, unknown>) => {
          let accessUrl = asset.url as string;

          if (asset.storage_type === 'supabase') {
            const { data: signedData } = await clients.adminClient.storage
              .from('assets')
              .createSignedUrl(asset.url as string, 3600);

            accessUrl = signedData?.signedUrl || (asset.url as string);
          }

          return {
            id: asset.id as string,
            url: accessUrl,
          };
        })
      );

      return resolved;
    },

    async getAccountStorageUsage(accountId: string): Promise<{
      accountId: string;
      usedBytes: number;
      usedMB: number;
      usedGB: number;
      assetCount: number;
    }> {
      const { data, error } = await clients.userClient
        .schema('core_hub')
        .from('assets')
        .select('file_size_bytes')
        .eq('account_id', accountId);

      if (error) {
        throw new Error(error.message);
      }

      const totalBytes = (data || []).reduce(
        (sum: number, asset: Record<string, unknown>) =>
          sum + ((asset.file_size_bytes as number) || 0),
        0
      );

      return {
        accountId,
        usedBytes: totalBytes,
        usedMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
        usedGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 1000) / 1000,
        assetCount: data?.length || 0,
      };
    },

    async resolveAssetByUrl(storagePath: string): Promise<{
      url: string;
      mimeType: string | null;
      fileSizeBytes: number | null;
      filename: string | null;
    } | null> {
      if (!storagePath || !storagePath.startsWith('accounts/')) {
        return null;
      }

      const { data: asset, error } = await clients.userClient
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
        const { data: signedData } = await clients.adminClient.storage
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
    },
  };
}

function getPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL not configured');
  }
  return `${supabaseUrl}/storage/v1/object/public/assets/${storagePath}`;
}

function extractStoragePath(url: string): string | null {
  if (url.startsWith('accounts/')) {
    return url;
  }
  if (url.includes('/storage/v1/object/files/')) {
    return url.split('/storage/v1/object/files/')[1];
  }
  return null;
}

function transformFromDatabase(record: Record<string, unknown>): Asset {
  return {
    id: record.id as string,
    accountId: record.account_id as string,
    uploaderUserId: record.uploader_user_id as string | null,
    type: record.type as string,
    url: record.url as string,
    filename: record.filename as string | null,
    mimeType: record.mime_type as string | null,
    fileSizeBytes: record.file_size_bytes as number | null,
    storageType: record.storage_type as 'supabase' | 'external',
    metadata: record.metadata as Record<string, unknown>,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    uploaderName: record.uploader_name as string | null,
    uploaderAvatar: record.uploader_avatar as string | null,
    accountName: record.account_name as string | null,
  };
}
