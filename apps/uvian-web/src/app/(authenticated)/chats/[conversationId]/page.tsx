import React from 'react';
import { ChatPageBreadcrumb } from '~/components/features/chat/components/chat-breadcrumb';
import { ChatView } from '~/components/features/chat/components/views/chat-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

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
      <PageHeader>
        <ChatPageBreadcrumb conversationId={conversationId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ChatView conversationId={conversationId} />
      </PageContent>
    </PageContainer>
  );
}
