
import React from 'react';
import { ConversationsPageBreadcrumb } from '~/components/features/chat/components/conversations-breadcrumb';
import { ConversationsListPageActions } from '~/components/features/chat/components/headers/conversations-list-page-actions';
import { ConversationsListPageActionProvider } from '~/components/features/chat/components/headers/conversations-list-page-action-provider';
import { ConversationsView } from '~/components/features/chat/components/views/conversations-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';

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
          <ConversationsView />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ConversationsListPageActionProvider>
  );
}
