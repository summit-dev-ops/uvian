'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoadingSkeleton,
  InterfaceEmpty,
} from '~/components/shared/ui/interfaces';
import { Button, ItemGroup } from '@org/ui';
import { agentQueries, AgentConfigUI } from '~/lib/domains/agents';
import { MODAL_IDS, useModalContext } from '~/components/shared/ui/modals';
import { AGENTS_LIST_ACTION_IDS } from '../pages/actions/agents-list-page-action-provider';

function AgentListItem({ agent }: { agent: AgentConfigUI }) {
  return (
    <Link
      href={`/accounts/${agent.account_id}/agents/${agent.id}`}
      className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{agent.name}</h3>
          {agent.description && (
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            agent.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {agent.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      {agent.subscribed_events.length > 0 && (
        <div className="flex gap-2 mt-2">
          {agent.subscribed_events.map((event) => (
            <span
              key={event}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {event}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function AgentsListInterface({ accountId }: { accountId: string }) {
  const agentsQuery = useQuery(agentQueries.list(accountId));
  const modalContext = useModalContext();

  const handleCreateAgent = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_AGENT, {
      onConfirmActionId: AGENTS_LIST_ACTION_IDS.CREATE_AGENT,
    });
  }, [modalContext]);

  if (agentsQuery.isError) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Agents"
            subtitle="Error loading agents"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Failed to Load Agents"
            message={
              agentsQuery.error?.message ||
              'There was an error loading your agents.'
            }
            showRetry={true}
            showHome={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (agentsQuery.isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader>
          <InterfaceHeaderContent title="Agents" subtitle="Loading agents..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <InterfaceLoadingSkeleton
                key={i}
                variant="card"
                lines={3}
                className="h-24"
              />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (agentsQuery.data?.length === 0) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Agents" subtitle="No agents yet" />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceEmpty
            variant="card"
            title="No agents yet"
            message="Create your first agent to start automating workflows."
            showIcon={true}
            action={<Button onClick={handleCreateAgent}>Create Agent</Button>}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Agents"
            subtitle={`${agentsQuery.data?.length || 0} agents`}
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <ItemGroup>
            {agentsQuery.data?.map((agent) => (
              <AgentListItem key={agent.id} agent={agent} />
            ))}
          </ItemGroup>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
