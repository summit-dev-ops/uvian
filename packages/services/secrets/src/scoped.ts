import { encrypt, decryptJson } from '@org/utils-encryption';
import {
  ServiceClients,
  SecretsScopedService,
  CreateSecretPayload,
  UpdateSecretPayload,
  SecretRecord,
} from './types';

export function createSecretsScopedService(
  clients: ServiceClients,
  encryptionSecret: string
): SecretsScopedService {
  return {
    async create(
      accountId: string,
      payload: CreateSecretPayload
    ): Promise<SecretRecord> {
      const encryptedValue = encrypt(payload.value, encryptionSecret);

      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .insert({
          account_id: accountId,
          name: payload.name,
          value_type: payload.valueType,
          encrypted_value: encryptedValue,
          metadata: payload.metadata || {},
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async list(accountId: string): Promise<SecretRecord[]> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown) => mapRow(row));
    },

    async get(
      accountId: string,
      secretId: string
    ): Promise<SecretRecord | null> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .eq('id', secretId)
        .single();

      if (error || !data) return null;
      return mapRow(data);
    },

    async getByName(
      accountId: string,
      name: string
    ): Promise<SecretRecord | null> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .eq('name', name)
        .single();

      if (error || !data) return null;
      return mapRow(data);
    },

    async getByIdWithDecryptedValue(
      accountId: string,
      secretId: string
    ): Promise<{
      id: string;
      name: string;
      value: string;
      metadata: Record<string, unknown>;
    } | null> {
      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
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

    async update(
      accountId: string,
      secretId: string,
      payload: UpdateSecretPayload
    ): Promise<SecretRecord> {
      const existing = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('id')
        .eq('account_id', accountId)
        .eq('id', secretId)
        .single();

      if (existing.error || !existing.data) {
        throw new Error('Secret not found or access denied');
      }

      const updateData: Record<string, unknown> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.metadata !== undefined)
        updateData.metadata = payload.metadata;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;
      if (payload.value !== undefined) {
        updateData.encrypted_value = encrypt(payload.value, encryptionSecret);
      }

      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .update(updateData)
        .eq('id', secretId)
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(
      accountId: string,
      secretId: string
    ): Promise<{ success: boolean }> {
      const existing = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('id')
        .eq('account_id', accountId)
        .eq('id', secretId)
        .single();

      if (existing.error || !existing.data) {
        throw new Error('Secret not found or access denied');
      }

      const { error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .delete()
        .eq('id', secretId)
        .eq('account_id', accountId);

      if (error) throw new Error('Cannot delete secret');
      return { success: true };
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
