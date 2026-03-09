import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { accountKeys } from './keys';
import type {
  AccountUI,
  CreateAccountPayload,
  UpdateAccountPayload,
  AddAccountMemberPayload,
  UpdateAccountMemberPayload,
  AccountMemberUI,
} from '../types';

export const accountMutations = {
  create: (
    queryClient: QueryClient
  ): MutationOptions<AccountUI, Error, CreateAccountPayload> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<AccountUI>(
        '/api/accounts',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  }),

  update: (
    queryClient: QueryClient
  ): MutationOptions<
    AccountUI,
    Error,
    { accountId: string; payload: UpdateAccountPayload }
  > => ({
    mutationFn: async ({ accountId, payload }) => {
      const { data } = await apiClient.patch<AccountUI>(
        `/api/accounts/${accountId}`,
        payload
      );
      return data;
    },
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.list() });
      queryClient.invalidateQueries({
        queryKey: accountKeys.detail(accountId),
      });
    },
  }),

  addMember: (
    queryClient: QueryClient
  ): MutationOptions<
    AccountMemberUI,
    Error,
    { accountId: string; payload: AddAccountMemberPayload }
  > => ({
    mutationFn: async ({ accountId, payload }) => {
      const { data } = await apiClient.post<AccountMemberUI>(
        `/api/accounts/${accountId}/members`,
        payload
      );
      return data;
    },
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({
        queryKey: accountKeys.membersByAccount(accountId),
      });
    },
  }),

  updateMember: (
    queryClient: QueryClient
  ): MutationOptions<
    AccountMemberUI,
    Error,
    { accountId: string; userId: string; payload: UpdateAccountMemberPayload }
  > => ({
    mutationFn: async ({ accountId, userId, payload }) => {
      const { data } = await apiClient.patch<AccountMemberUI>(
        `/api/accounts/${accountId}/members/${userId}`,
        payload
      );
      return data;
    },
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({
        queryKey: accountKeys.membersByAccount(accountId),
      });
    },
  }),

  removeMember: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, { accountId: string; userId: string }> => ({
    mutationFn: async ({ accountId, userId }) => {
      await apiClient.delete(`/api/accounts/${accountId}/members/${userId}`);
    },
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({
        queryKey: accountKeys.membersByAccount(accountId),
      });
    },
  }),
};
