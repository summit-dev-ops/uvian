import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateAgentConfigPayload {
  userId: string;
  accountId: string;
  systemPrompt?: string;
  maxConversationHistory?: number;
  config?: Record<string, unknown>;
}

export interface UpdateAgentConfigPayload {
  systemPrompt?: string;
  maxConversationHistory?: number;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface LinkLlmPayload {
  llmId: string;
  secretName?: string;
  secretValue?: string;
  isDefault?: boolean;
}

export interface UpdateLlmLinkPayload {
  secretValue?: string;
  isDefault?: boolean;
}

export interface LinkMcpPayload {
  mcpId: string;
  secretName?: string;
  secretValue?: string;
}

export interface UpdateMcpLinkPayload {
  secretValue?: string;
  isDefault?: boolean;
}

export interface LinkSkillPayload {
  skillId: string;
}

export interface AgentConfigRecord {
  id: string;
  ownerUserId: string;
  accountId: string;
  systemPrompt?: string;
  maxConversationHistory: number;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedLlm {
  id: string;
  name: string;
  type: string;
  model_name: string;
  base_url: string;
  api_key?: string | null;
  temperature: number;
  is_default: boolean;
  config?: Record<string, unknown>;
}

export interface LinkedMcp {
  id: string;
  name: string;
  url: string;
  auth_method: string;
  _auth_secret?: string | null;
  usage_guidance?: string;
  auto_load_events?: string[];
  is_default?: boolean;
}

export interface LinkedSkill {
  id: string;
  name: string;
  description: string;
  content: Record<string, unknown>;
  autoLoadEvents: string[];
  isPrivate: boolean;
  linkConfig: Record<string, unknown>;
}

export interface AgentSecrets {
  llms: LinkedLlm[];
  mcps: LinkedMcp[];
}

export interface AgentConfigScopedService {
  create(payload: CreateAgentConfigPayload): Promise<AgentConfigRecord>;
  getById(agentId: string): Promise<AgentConfigRecord | null>;
  getByUserId(ownerUserId: string): Promise<AgentConfigRecord | null>;
  update(
    agentId: string,
    payload: UpdateAgentConfigPayload,
  ): Promise<AgentConfigRecord>;
  getLlms(agentId: string): Promise<LinkedLlm[]>;
  linkLlm(agentId: string, payload: LinkLlmPayload): Promise<unknown>;
  unlinkLlm(agentId: string, llmId: string): Promise<{ success: boolean }>;
  updateLlmLink(
    agentId: string,
    llmId: string,
    payload: UpdateLlmLinkPayload,
  ): Promise<unknown>;
  getMcps(agentId: string): Promise<LinkedMcp[]>;
  linkMcp(agentId: string, payload: LinkMcpPayload): Promise<unknown>;
  unlinkMcp(agentId: string, mcpId: string): Promise<{ success: boolean }>;
  updateMcpLink(
    agentId: string,
    mcpId: string,
    payload: UpdateMcpLinkPayload,
  ): Promise<unknown>;
  getSkills(agentId: string): Promise<LinkedSkill[]>;
  linkSkill(agentId: string, payload: LinkSkillPayload): Promise<unknown>;
  unlinkSkill(agentId: string, skillId: string): Promise<{ success: boolean }>;
  getAgentSecrets(ownerUserId: string): Promise<AgentSecrets>;
}

export interface AgentConfigAdminService {
  getById(agentId: string): Promise<AgentConfigRecord | null>;
}

export interface CreateAgentConfigServiceConfig {
  encryptionSecret?: string;
}
