import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { AgentDetailPageBreadcrumb } from '~/components/features/agents/components/pages/breadcrumbs';
import { AgentDetailInterface } from '~/components/features/agents/components/interfaces';
import { ModalProvider } from '~/components/shared/ui/modals';
import {
  AgentDetailPageActionProvider,
  AgentDetailPageActions,
} from '~/components/features/agents/components/pages/actions';

interface AgentDetailPageProps {
  params: Promise<{ accountId: string; agentId: string }>;
}

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { accountId, agentId } = await params;

  return (
    <ModalProvider>
      <AgentDetailPageActionProvider accountId={accountId} agentId={agentId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AgentDetailPageBreadcrumb
                  accountId={accountId}
                  agentId={agentId}
                />
                <PageActions>
                  <AgentDetailPageActions
                    accountId={accountId}
                    agentId={agentId}
                  />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AgentDetailInterface accountId={accountId} agentId={agentId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AgentDetailPageActionProvider>
    </ModalProvider>
  );
}
