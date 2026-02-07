import React from 'react';
import { ConversationsPageBreadcrumb } from '~/components/features/chat/components/conversations-breadcrumb';
import { ConversationsView } from '~/components/features/chat/components/views/conversations-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

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
      <PageHeader>
        <ConversationsPageBreadcrumb />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ConversationsView />
      </PageContent>
    </PageContainer>
  );
}
