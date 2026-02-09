import React from 'react';
import { ChatPageBreadcrumb } from '~/components/features/chat/components/chat-breadcrumb';
import { ChatPageActions } from '~/components/features/chat/components/headers/chat-page-actions';
import { ChatView } from '~/components/features/chat/components/views/chat-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader className='flex flex-row flex-1 items-center justify-between'>
        <ChatPageBreadcrumb conversationId={conversationId} />
        <PageActions>
          <ChatPageActions conversationId={conversationId}/>
        </PageActions>
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ChatView conversationId={conversationId} />
      </PageContent>
    </PageContainer>
  );
}
