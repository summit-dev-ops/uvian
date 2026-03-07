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
  ChatPageActionProvider,
  ChatPageActions,
} from '~/components/features/chat/components/pages/actions';
import { ChatPageBreadcrumb } from '~/components/features/chat/components/pages/breadcrumbs';
import { ChatInterface } from '~/components/features/chat/components/interfaces/chat-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { ChatSidebar } from '~/components/features/chat/components/pages/sidebar';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ModalProvider>
      <PageWrapper>
        <PageWrapperSidebar>
          <ChatSidebar currentConversationId={conversationId} />
        </PageWrapperSidebar>
        <PageWrapperContent>
          <ChatPageActionProvider conversationId={conversationId}>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 min-w-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center min-w-0 justify-between">
                <ChatPageBreadcrumb conversationId={conversationId} />
                <PageActions>
                  <ChatPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-w-0 min-h-0 relative">
                <ChatInterface conversationId={conversationId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </ChatPageActionProvider>
        </PageWrapperContent>
      </PageWrapper>
    </ModalProvider>
  );
}
