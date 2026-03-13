'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useCreateAgent } from '~/lib/domains/agents/api/mutations';
import { agentQueries } from '~/lib/domains/agents/api/queries';

export interface AgentsListPageActionContextType {
  readonly ACTION_CREATE_AGENT: 'create-agent';
  readonly ACTION_REFRESH_AGENTS: 'refresh-agents';
}

interface AgentsListPageActionProviderProps {
  accountId: string;
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const LIST_ACTION_IDS = {
  CREATE_AGENT: 'create-agent',
  REFRESH_AGENTS: 'refresh-agents',
} as const;

export function AgentsListPageActionProvider({
  accountId,
  children,
  onError,
  onSuccess,
}: AgentsListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const createAgent = useCreateAgent(accountId);

  const handleCreateAgent = React.useCallback(
    async (data: {
      name: string;
      description: string;
      subscribed_events: string[];
    }) => {
      try {
        await createAgent.mutateAsync(data);
      } catch (error) {
        console.error('Failed to create agent:', error);
        throw error;
      }
    },
    [createAgent]
  );

  const handleRefreshAgents = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: agentQueries.list(accountId).queryKey,
    });
  }, [queryClient, accountId]);

  const actions: ActionRegistrationType[] = [
    {
      id: LIST_ACTION_IDS.CREATE_AGENT,
      label: 'New Agent',
      handler: handleCreateAgent,
      loadingLabel: 'Creating...',
    },
    {
      id: LIST_ACTION_IDS.REFRESH_AGENTS,
      label: 'Refresh',
      handler: handleRefreshAgents,
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

export const AGENTS_LIST_ACTION_IDS = LIST_ACTION_IDS;
