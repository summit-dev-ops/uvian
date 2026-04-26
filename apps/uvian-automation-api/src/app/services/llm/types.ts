import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateLlmPayload {
  name: string;
  type: string;
  provider: string;
  modelName: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, unknown>;
  isDefault?: boolean;
}

export interface UpdateLlmPayload {
  name?: string;
  type?: string;
  provider?: string;
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  config?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface LlmRecord {
  id: string;
  accountId: string;
  name: string;
  type: string;
  provider: string;
  modelName: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  config: Record<string, unknown>;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LlmScopedService {
  list(accountId: string): Promise<LlmRecord[]>;
  get(llmId: string): Promise<LlmRecord | null>;
  create(accountId: string, payload: CreateLlmPayload): Promise<LlmRecord>;
  update(llmId: string, payload: UpdateLlmPayload): Promise<LlmRecord>;
  delete(llmId: string): Promise<{ success: boolean }>;
}

export interface LlmAdminService {
  getById(llmId: string): Promise<LlmRecord | null>;
}

export interface CreateLlmServiceConfig {}
