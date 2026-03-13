'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useDeleteAgent } from '~/lib/domains/agents/api/mutations';
import { agentQueries } from '~/lib/domains/agents/api/queries';

interface AgentDetailPageActionProviderProps {
  accountId: string;
  agentId: string;
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const DETAIL_ACTION_IDS = {
  DELETE_AGENT: 'delete-agent',
  REFRESH_AGENT: 'refresh-agent',
} as const;

export function AgentDetailPageActionProvider({
  accountId,
  agentId,
  children,
  onError,
  onSuccess,
}: AgentDetailPageActionProviderProps) {
  const queryClient = useQueryClient();
  const deleteAgent = useDeleteAgent(accountId);

  const handleDeleteAgent = React.useCallback(async () => {
    await deleteAgent.mutateAsync(agentId);
  }, [deleteAgent, agentId]);

  const handleRefreshAgent = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: agentQueries.detail(accountId, agentId).queryKey,
    });
  }, [queryClient, accountId, agentId]);

  const actions: ActionRegistrationType[] = [
    {
      id: DETAIL_ACTION_IDS.DELETE_AGENT,
      label: 'Delete Agent',
      handler: handleDeleteAgent,
      loadingLabel: 'Deleting...',
      destructive: true,
    },
    {
      id: DETAIL_ACTION_IDS.REFRESH_AGENT,
      label: 'Refresh',
      handler: handleRefreshAgent,
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

export const AGENT_DETAIL_ACTION_IDS = DETAIL_ACTION_IDS;
