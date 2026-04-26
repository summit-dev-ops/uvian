import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateSkillPayload {
  name: string;
  description: string;
  content: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface UpdateSkillPayload {
  name?: string;
  description?: string;
  content?: Record<string, unknown>;
  isPrivate?: boolean;
  isActive?: boolean;
}

export interface SkillRecord {
  id: string;
  accountId: string;
  name: string;
  description: string;
  content: Record<string, unknown>;
  isPrivate: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedSkill {
  id: string;
  name: string;
  description: string;
  content: Record<string, unknown>;
  isPrivate: boolean;
  linkConfig: Record<string, unknown>;
}

export interface SkillScopedService {
  list(accountId: string): Promise<SkillRecord[]>;
  get(skillId: string): Promise<SkillRecord | null>;
  create(accountId: string, payload: CreateSkillPayload): Promise<SkillRecord>;
  update(skillId: string, accountId: string, payload: UpdateSkillPayload): Promise<SkillRecord>;
  delete(skillId: string): Promise<{ success: boolean }>;
}

export interface SkillAdminService {
  getById(skillId: string): Promise<SkillRecord | null>;
}
