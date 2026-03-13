'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
  InterfaceError,
  InterfaceLoadingSkeleton,
} from '~/components/shared/ui/interfaces';
import { agentQueries } from '~/lib/domains/agents';

interface AgentDetailInterfaceProps {
  accountId: string;
  agentId: string;
}

export function AgentDetailInterface({
  accountId,
  agentId,
}: AgentDetailInterfaceProps) {
  const {
    data: agent,
    isLoading,
    error,
  } = useQuery(agentQueries.detail(accountId, agentId));

  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Agent"
            subtitle="Error loading agent"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Agent"
            message={error.message || 'Something went wrong.'}
            showRetry={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (isLoading || !agent) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent title="Agent" subtitle="Loading..." />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoadingSkeleton className="h-32" />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title={agent.name}
            subtitle={agent.description || 'Agent details'}
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Status
              </h3>
              <p>{agent.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Subscribed Events
              </h3>
              <div className="flex gap-2 mt-1">
                {agent.subscribed_events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Created
              </h3>
              <p>{new Date(agent.created_at).toLocaleString()}</p>
            </div>
          </div>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
