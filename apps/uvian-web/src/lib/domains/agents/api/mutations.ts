import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { agentKeys, providerKeys } from './keys';
import type {
  AgentConfigUI,
  AgentConfigDraft,
  AutomationProviderUI,
} from '../types';

export function useCreateAgent(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AgentConfigDraft) => {
      const { data } = await apiClient.post<{ agent: AgentConfigUI }>(
        `/api/accounts/${accountId}/agents`,
        payload
      );
      return data.agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list(accountId) });
    },
  });
}

export function useUpdateAgent(accountId: string, agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<AgentConfigDraft>) => {
      const { data } = await apiClient.put<{ agent: AgentConfigUI }>(
        `/api/accounts/${accountId}/agents/${agentId}`,
        payload
      );
      return data.agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list(accountId) });
      queryClient.invalidateQueries({
        queryKey: agentKeys.detail(accountId, agentId),
      });
    },
  });
}

export function useDeleteAgent(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      await apiClient.delete(`/api/accounts/${accountId}/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list(accountId) });
    },
  });
}

export function useCreateProvider(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      type?: 'internal' | 'webhook';
      url?: string;
      auth_method?: 'none' | 'bearer' | 'api_key';
      auth_config?: Record<string, any>;
    }) => {
      const { data } = await apiClient.post<{ provider: AutomationProviderUI }>(
        `/api/accounts/${accountId}/providers`,
        payload
      );
      return data.provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.list(accountId) });
    },
  });
}

export function useUpdateProvider(accountId: string, providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Partial<{
        name: string;
        type: 'internal' | 'webhook';
        url: string;
        auth_method: 'none' | 'bearer' | 'api_key';
        auth_config: Record<string, any>;
        is_active: boolean;
      }>
    ) => {
      const { data } = await apiClient.put<{ provider: AutomationProviderUI }>(
        `/api/accounts/${accountId}/providers/${providerId}`,
        payload
      );
      return data.provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.list(accountId) });
    },
  });
}

export function useDeleteProvider(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string) => {
      await apiClient.delete(
        `/api/accounts/${accountId}/providers/${providerId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.list(accountId) });
    },
  });
}
