import React, { Suspense } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { NoteDetailPageBreadcrumb } from './breadcrumbs/note-detail-page-breadcrumb';
import { NoteDetailInterface } from '~/components/features/notes/components/interfaces/note-detail-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import {
  NoteDetailPageActionProvider,
  NoteDetailPageActions,
} from '~/components/features/notes/components/pages/actions/note-detail-page-action-provider';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; noteId: string }>;
}) {
  const { spaceId, noteId } = await params;

  return (
    <ModalProvider>
      <NoteDetailPageActionProvider spaceId={spaceId} noteId={noteId}>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <NoteDetailPageBreadcrumb spaceId={spaceId} noteId={noteId} />
                <PageActions>
                  <NoteDetailPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <Suspense fallback={<div>Loading note...</div>}>
                  <NoteDetailInterface spaceId={spaceId} noteId={noteId} />
                </Suspense>
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </NoteDetailPageActionProvider>
    </ModalProvider>
  );
}
