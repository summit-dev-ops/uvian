import type { Database } from '../../clients/supabase.client';

export type AutomationProvider =
  Database['public']['Tables']['automaton_providers']['Row'];
export type CreateAutomationProviderPayload =
  Database['public']['Tables']['automaton_providers']['Insert'];
export type UpdateAutomationProviderPayload =
  Database['public']['Tables']['automaton_providers']['Insert'];

export type UserAutomationProvider =
  Database['public']['Tables']['user_automation_providers']['Row'];

export interface CreateAutomationProviderServiceConfig {}

export interface AutomationProviderScopedService {
  getProvidersByAccount(accountId: string): Promise<AutomationProvider[]>;
  getProviderById(
    providerId: string,
    accountId: string
  ): Promise<AutomationProvider | null>;
  getUserLinkById(providerId: string): Promise<UserAutomationProvider | null>;
  getInternalProvider(accountId: string): Promise<AutomationProvider | null>;
  createProvider(
    userId: string,
    accountId: string,
    payload: CreateAutomationProviderPayload
  ): Promise<AutomationProvider>;
  updateProvider(
    userId: string,
    providerId: string,
    accountId: string,
    payload: Partial<UpdateAutomationProviderPayload>
  ): Promise<AutomationProvider>;
  deleteProvider(
    userId: string,
    providerId: string,
    accountId: string
  ): Promise<void>;
  linkUserToProvider(
    userId: string,
    automationProviderId: string
  ): Promise<UserAutomationProvider>;
  unlinkUserFromProvider(userId: string, providerLinkId: string): Promise<void>;
  getUserProviderLinks(userId: string): Promise<UserAutomationProvider[]>;
  getProvidersByUser(userId: string): Promise<UserAutomationProvider[]>;
}

export interface AutomationProviderAdminService {
  getProviderById(providerId: string): Promise<AutomationProvider | null>;
  getProvidersByAccountId(accountId: string): Promise<AutomationProvider[]>;
  getInternalProviderByAccountId(
    accountId: string
  ): Promise<AutomationProvider | null>;
  getProvidersByOwner(userId: string): Promise<AutomationProvider[]>;
  getActiveProviders(): Promise<AutomationProvider[]>;
  getAllProviders(): Promise<AutomationProvider[]>;
  linkUserToProvider(
    userId: string,
    automationProviderId: string
  ): Promise<UserAutomationProvider>;
  unlinkUserFromProvider(providerLinkId: string): Promise<void>;
  getAllUserProviderLinks(): Promise<UserAutomationProvider[]>;
  getUserProviderLinksByUserId(
    userId: string
  ): Promise<UserAutomationProvider[]>;
}
