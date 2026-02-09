import React from 'react';
import { ConversationsPageBreadcrumb } from '~/components/features/chat/components/conversations-breadcrumb';
import { ConversationsListPageActions } from '~/components/features/chat/components/headers/conversations-list-page-actions';
import { ConversationsView } from '~/components/features/chat/components/views/conversations-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';

export default async function ConversationsPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await params;

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader className='flex flex-row flex-1 items-center justify-between'>
        <ConversationsPageBreadcrumb />
        <PageActions>
          <ConversationsListPageActions/>
        </PageActions>
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ConversationsView />
      </PageContent>
    </PageContainer>
  );
}
