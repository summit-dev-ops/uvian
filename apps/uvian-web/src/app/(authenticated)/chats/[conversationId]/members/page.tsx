import React, { Suspense } from 'react';
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
  ChatMembersPageActionProvider,
  ChatMembersPageActions,
} from '~/components/features/chat/components/pages/actions';
import { MembersPageBreadcrumb } from '~/components/features/chat/components/pages/breadcrumbs';
import { ChatMembersInterface } from '~/components/features/chat/components/interfaces/chat-members-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function ConversationMembersPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ModalProvider>
      <ChatMembersPageActionProvider conversationId={conversationId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <MembersPageBreadcrumb conversationId={conversationId} />
                <PageActions>
                  <ChatMembersPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <Suspense fallback={<div>Loading conversation members...</div>}>
                  <ChatMembersInterface conversationId={conversationId} />
                </Suspense>
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </ChatMembersPageActionProvider>
    </ModalProvider>
  );
}
