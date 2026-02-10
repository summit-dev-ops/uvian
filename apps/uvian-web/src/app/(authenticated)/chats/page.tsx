
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';
import { ConversationsListPageActionProvider, ConversationsListPageActions } from '~/components/features/chat/components/pages/actions';
import { ConversationsPageBreadcrumb } from '~/components/features/chat/components/pages/breadcrumbs';
import { ConversationsListInterface } from '~/components/features/chat/components/interfaces/conversations-list-interface';

export default async function ConversationsPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the conversations list page

  return (
    <ConversationsListPageActionProvider>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ConversationsPageBreadcrumb />
          <PageActions>
            <ConversationsListPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ConversationsListInterface />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ConversationsListPageActionProvider>
  );
}
