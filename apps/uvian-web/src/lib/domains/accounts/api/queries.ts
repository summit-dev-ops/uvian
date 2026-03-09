import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { accountKeys } from './keys';
import type { AccountUI, AccountMemberUI } from '../types';

export const accountQueries = {
  list: () =>
    queryOptions({
      queryKey: accountKeys.list(),
      queryFn: async () => {
        const { data } = await apiClient.get<{ accounts: AccountUI[] }>(
          '/api/accounts'
        );
        return data.accounts;
      },
      staleTime: 1000 * 60 * 5,
    }),

  account: (accountId: string) =>
    queryOptions({
      queryKey: accountKeys.detail(accountId),
      queryFn: async () => {
        const { data } = await apiClient.get<AccountUI>(
          `/api/accounts/${accountId}`
        );
        return data;
      },
      staleTime: 1000 * 60 * 5,
    }),

  members: (accountId: string) =>
    queryOptions({
      queryKey: accountKeys.membersByAccount(accountId),
      queryFn: async () => {
        const { data } = await apiClient.get<{ members: AccountMemberUI[] }>(
          `/api/accounts/${accountId}/members`
        );
        return data.members;
      },
      staleTime: 1000 * 60 * 5,
    }),
};
