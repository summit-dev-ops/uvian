import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateMcpPayload {
  name: string;
  type: string;
  url?: string;
  authMethod: string;
  config?: Record<string, unknown>;
}

export interface UpdateMcpPayload {
  name?: string;
  type?: string;
  url?: string;
  authMethod?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface McpRecord {
  id: string;
  accountId: string;
  name: string;
  type: string;
  url?: string;
  authMethod: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface McpScopedService {
  list(accountId: string): Promise<McpRecord[]>;
  get(mcpId: string): Promise<McpRecord | null>;
  create(accountId: string, payload: CreateMcpPayload): Promise<McpRecord>;
  update(mcpId: string, payload: UpdateMcpPayload): Promise<McpRecord>;
  delete(mcpId: string): Promise<{ success: boolean }>;
}

export interface McpAdminService {
  getById(mcpId: string): Promise<McpRecord | null>;
}

export interface CreateMcpServiceConfig {}
