export type TriggerType = 'event' | 'tool_name_prefix';

export interface TriggerJsonEvent {
  type: 'event';
  patterns: string[];
}

export interface TriggerJsonToolNamePrefix {
  type: 'tool_name_prefix';
  pattern: string;
}

export type TriggerJson = TriggerJsonEvent | TriggerJsonToolNamePrefix;

export interface Hook {
  id: string;
  accountId: string;
  name: string;
  triggerJson: TriggerJson;
  action: 'interrupt' | 'log' | 'block';
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHookRequest {
  Body: {
    accountId: string;
    name: string;
    triggerJson: TriggerJson;
    action: 'interrupt' | 'log' | 'block';
    config?: Record<string, unknown>;
  };
}

export interface UpdateHookRequest {
  Body: {
    name?: string;
    triggerJson?: TriggerJson;
    action?: 'interrupt' | 'log' | 'block';
    config?: Record<string, unknown>;
    isActive?: boolean;
  };
}

export interface HookFilters {
  accountId: string;
  isActive?: boolean;
}

export interface GetHooksRequest {
  Querystring: HookFilters;
}

export interface GetHookRequest {
  Params: {
    id: string;
  };
}

export interface UpdateHookRequest {
  Params: {
    id: string;
  };
  Body: {
    name?: string;
    triggerJson?: TriggerJson;
    action?: 'interrupt' | 'log' | 'block';
    config?: Record<string, unknown>;
    isActive?: boolean;
  };
}

export interface DeleteHookRequest {
  Params: {
    id: string;
  };
}

export interface LinkHookToAgentRequest {
  Params: {
    id: string;
    agentId: string;
  };
}

export interface UnlinkHookFromAgentRequest {
  Params: {
    id: string;
    agentId: string;
  };
}
