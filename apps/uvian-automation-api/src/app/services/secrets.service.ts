import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import { encrypt, decryptJson } from './encryption.service';

const ENCRYPTION_SECRET = process.env.SECRET_INTERNAL_API_KEY!;

export type SecretType = 'api_key' | 'bearer' | 'jwt' | 'api_key_json';

export interface CreateSecretPayload {
  accountId: string;
  name: string;
  secretType: SecretType;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSecretPayload {
  name?: string;
  value?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export class SecretsService {
  async create(userClient: SupabaseClient, payload: CreateSecretPayload) {
    const encryptedValue = encrypt(payload.value, ENCRYPTION_SECRET);

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('secrets')
      .insert({
        account_id: payload.accountId,
        name: payload.name,
        secret_type: payload.secretType,
        encrypted_value: encryptedValue,
        metadata: payload.metadata || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async list(userClient: SupabaseClient, accountId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('secrets')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => this.mapRow(row));
  }

  async get(userClient: SupabaseClient, secretId: string) {
    const { data, error } = await userClient
      .schema('core_automation')
      .from('secrets')
      .select('*')
      .eq('id', secretId)
      .single();

    if (error || !data) throw new Error('Secret not found');
    return this.mapRow(data);
  }

  async update(
    userClient: SupabaseClient,
    secretId: string,
    payload: UpdateSecretPayload
  ) {
    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata;
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive;
    if (payload.value !== undefined) {
      updateData.encrypted_value = encrypt(payload.value, ENCRYPTION_SECRET);
    }

    const { data, error } = await adminSupabase
      .schema('core_automation')
      .from('secrets')
      .update(updateData)
      .eq('id', secretId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async delete(userClient: SupabaseClient, secretId: string) {
    const { error } = await adminSupabase
      .schema('core_automation')
      .from('secrets')
      .delete()
      .eq('id', secretId);

    if (error) throw new Error('Cannot delete secret');
    return { success: true };
  }

  getDecryptedValue(encryptedValue: string): string {
    return decryptJson<string>(encryptedValue, ENCRYPTION_SECRET);
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      secretType: row.secret_type,
      hasValue: !!row.encrypted_value,
      metadata: row.metadata,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const secretsService = new SecretsService();
