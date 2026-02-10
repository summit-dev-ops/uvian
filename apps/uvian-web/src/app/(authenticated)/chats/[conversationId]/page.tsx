
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';
import { ChatPageActionProvider, ChatPageActions } from '~/components/features/chat/components/pages/actions';
import { ChatPageBreadcrumb } from '~/components/features/chat/components/pages/breadcrumbs';
import { ChatInterface } from '~/components/features/chat/components/interfaces/chat-interface';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ChatPageActionProvider conversationId={conversationId}>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ChatPageBreadcrumb conversationId={conversationId} />
          <PageActions>
            <ChatPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ChatInterface conversationId={conversationId} />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ChatPageActionProvider>
  );
}
