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
import {
  AgentsListPageActionProvider,
  AgentsListPageActions,
} from '~/components/features/agents/components/pages/actions';
import { AgentsPageBreadcrumb } from '~/components/features/agents/components/pages/breadcrumbs';
import { AgentsListInterface } from '~/components/features/agents/components/interfaces/agents-list-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;

  return (
    <ModalProvider>
      <AgentsListPageActionProvider accountId={accountId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AgentsPageBreadcrumb />
                <PageActions>
                  <AgentsListPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AgentsListInterface accountId={accountId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AgentsListPageActionProvider>
    </ModalProvider>
  );
}
