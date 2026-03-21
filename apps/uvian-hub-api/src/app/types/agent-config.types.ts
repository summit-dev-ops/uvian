export interface AgentConfig {
  id: string;
  agent_user_id: string;
  account_id: string;
  automation_provider_id: string;
  name: string;
  description: string | null;
  subscribed_events: string[];
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  agent_display_name?: string | null;
  agent_avatar_url?: string | null;
}

export interface CreateAgentConfigPayload {
  name: string;
  description?: string;
  subscribed_events?: string[];
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateAgentConfigPayload {
  name?: string;
  description?: string;
  subscribed_events?: string[];
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface CreateAgentRequest {
  Params: {
    accountId: string;
  };
  Body: CreateAgentConfigPayload & {
    email?: string;
  };
}

export interface GetAgentsRequest {
  Params: {
    accountId: string;
  };
}

export interface GetAgentRequest {
  Params: {
    accountId: string;
    agentId: string;
  };
}

export interface UpdateAgentRequest {
  Params: {
    accountId: string;
    agentId: string;
  };
  Body: UpdateAgentConfigPayload;
}

export interface DeleteAgentRequest {
  Params: {
    accountId: string;
    agentId: string;
  };
}

export const AVAILABLE_EVENT_TYPES = [
  'conversation.join',
  'conversation.mention',
  'conversation.message',
] as const;

export type EventType = (typeof AVAILABLE_EVENT_TYPES)[number];
