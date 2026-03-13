import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { agentKeys, providerKeys } from './keys';
import type { AgentConfigUI, AutomationProviderUI } from '../types';

export const agentQueries = {
  list: (accountId: string) =>
    queryOptions({
      queryKey: agentKeys.list(accountId),
      queryFn: async () => {
        const { data } = await apiClient.get<{ agents: AgentConfigUI[] }>(
          `/api/accounts/${accountId}/agents`
        );
        return data.agents;
      },
      staleTime: 1000 * 60 * 5,
    }),

  detail: (accountId: string, agentId: string) =>
    queryOptions({
      queryKey: agentKeys.detail(accountId, agentId),
      queryFn: async () => {
        const { data } = await apiClient.get<{ agent: AgentConfigUI }>(
          `/api/accounts/${accountId}/agents/${agentId}`
        );
        return data.agent;
      },
      staleTime: 1000 * 60 * 5,
    }),
};

export const providerQueries = {
  list: (accountId: string) =>
    queryOptions({
      queryKey: providerKeys.list(accountId),
      queryFn: async () => {
        const { data } = await apiClient.get<{
          providers: AutomationProviderUI[];
        }>(`/api/accounts/${accountId}/providers`);
        return data.providers;
      },
      staleTime: 1000 * 60 * 5,
    }),
};
