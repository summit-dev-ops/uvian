
import React, { use } from 'react';
import { ChatPageBreadcrumb } from '~/components/features/chat/components/chat-breadcrumb';
import { ChatPageActions } from '~/components/features/chat/components/headers/chat-page-actions';
import { ChatPageActionProvider } from '~/components/features/chat/components/headers/chat-page-action-provider';
import { ChatView } from '~/components/features/chat/components/views/chat-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';

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
          <ChatView conversationId={conversationId} />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ChatPageActionProvider>
  );
}
