import { decryptJson } from '@org/utils-encryption';
import { ServiceClients, SecretsAdminService, SecretRecord } from './types';

export function createSecretsAdminService(
  clients: ServiceClients,
  encryptionSecret: string
): SecretsAdminService {
  return {
    async getById(secretId: string): Promise<SecretRecord | null> {
      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('id', secretId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch secret: ${error.message}`);
      }

      if (!data) return null;
      return mapRow(data);
    },

    async getByAccountId(accountId: string): Promise<SecretRecord[]> {
      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch secrets: ${error.message}`);
      }

      return (data || []).map((row: unknown) => mapRow(row));
    },

    async getByIdWithDecryptedValue(secretId: string): Promise<{
      id: string;
      name: string;
      value: string;
      metadata: Record<string, unknown>;
    } | null> {
      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('id', secretId)
        .single();

      if (error || !data) return null;

      const decryptedValue = decryptJson<string>(
        data.encrypted_value,
        encryptionSecret
      );
      return {
        id: data.id,
        name: data.name,
        value: decryptedValue,
        metadata: data.metadata || {},
      };
    },

    async getAccountIdForUser(userId: string): Promise<string | null> {
      const { data, error } = await clients.adminClient
        .from('account_members')
        .select('account_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.account_id;
    },
  };
}

function mapRow(row: unknown): SecretRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    valueType: r.value_type as 'text' | 'json',
    hasValue: !!r.encrypted_value,
    metadata: r.metadata as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
