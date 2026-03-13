'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { accountQueries } from '~/lib/domains/accounts';

export function AccountsListPageActionProvider({
  children,
  onError,
  onSuccess,
}: {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}) {
  const queryClient = useQueryClient();

  const handleRefreshAccounts = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: accountQueries.list().queryKey,
    });
  }, [queryClient]);

  const actions: ActionRegistrationType[] = [
    {
      id: 'refresh-accounts',
      label: 'Refresh',
      handler: handleRefreshAccounts,
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
