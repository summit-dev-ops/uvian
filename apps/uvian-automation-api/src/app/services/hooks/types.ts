import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateHookPayload {
  accountId: string;
  name: string;
  triggerJson: { type: string; pattern: string };
  action: 'interrupt' | 'log' | 'block';
  config?: Record<string, unknown>;
}

export interface UpdateHookPayload {
  name?: string;
  triggerJson?: { type: string; pattern: string };
  action?: 'interrupt' | 'log' | 'block';
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface HookRecord {
  hookId: string;
  accountId: string;
  name: string;
  triggerJson: { type: string; pattern: string };
  action: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface ListHooksFilters {
  isActive?: boolean;
}

export interface HookScopedService {
  create(payload: CreateHookPayload): Promise<{ hookId: string }>;
  list(filters?: ListHooksFilters): Promise<{ hooks: HookRecord[] }>;
  get(hookId: string): Promise<HookRecord | null>;
  update(hookId: string, payload: UpdateHookPayload): Promise<HookRecord>;
  delete(hookId: string): Promise<{ success: boolean }>;
  linkToAgent(hookId: string, agentId: string): Promise<{ success: boolean }>;
  unlinkFromAgent(
    hookId: string,
    agentId: string,
  ): Promise<{ success: boolean }>;
}

export interface HookAdminService {
  getById(hookId: string): Promise<HookRecord | null>;
}

export interface CreateHookServiceConfig {}
