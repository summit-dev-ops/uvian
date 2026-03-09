'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api/queries';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

export interface UsersListPageActionContextType {
  readonly ACTION_REFRESH_USERS: 'refresh-users';
}

interface UsersListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const USERS_ACTION_IDS = {
  REFRESH_USERS: 'refresh-users',
} as const;

export function UsersListPageActionProvider({
  children,
  onError,
  onSuccess,
}: UsersListPageActionProviderProps) {
  const queryClient = useQueryClient();

  const handleRefreshUsers = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: userQueries.userList().queryKey,
    });
  }, [queryClient]);

  const actions: ActionRegistrationType[] = [
    {
      id: USERS_ACTION_IDS.REFRESH_USERS,
      label: 'Refresh',
      handler: handleRefreshUsers,
    },
  ];

  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useUsersListPageActionContext() {
  const context = React.useContext(
    React.createContext<UsersListPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useUsersListPageActionContext must be used within a UsersListPageActionProvider'
    );
  }
  return context;
}
