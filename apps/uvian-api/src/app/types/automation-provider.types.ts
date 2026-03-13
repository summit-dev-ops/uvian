export interface AutomationProvider {
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
}

export interface CreateAutomationProviderPayload {
  name: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateAutomationProviderPayload {
  name?: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, any>;
  is_active?: boolean;
}

export interface CreateAutomationProviderRequest {
  Params: {
    accountId: string;
  };
  Body: CreateAutomationProviderPayload;
}

export interface GetAutomationProvidersRequest {
  Params: {
    accountId: string;
  };
}

export interface UpdateAutomationProviderRequest {
  Params: {
    accountId: string;
    providerId: string;
  };
  Body: UpdateAutomationProviderPayload;
}

export interface DeleteAutomationProviderRequest {
  Params: {
    accountId: string;
    providerId: string;
  };
}
