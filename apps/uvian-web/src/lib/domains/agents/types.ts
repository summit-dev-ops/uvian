export type AgentConfigUI = {
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
};

export type AgentConfigDraft = {
  name: string;
  description?: string;
  subscribed_events?: string[];
  config?: Record<string, any>;
  is_active?: boolean;
};

export type AutomationProviderUI = {
  id: string;
  account_id: string;
  owner_user_id: string;
  name: string;
  type: 'internal' | 'webhook';
  url: string | null;
  auth_method: 'none' | 'bearer' | 'api_key';
  auth_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const AVAILABLE_EVENT_TYPES = [
  { value: 'conversation.join', label: 'Conversation Join' },
  { value: 'conversation.mention', label: 'Mention' },
  { value: 'conversation.message', label: 'New Message' },
] as const;
