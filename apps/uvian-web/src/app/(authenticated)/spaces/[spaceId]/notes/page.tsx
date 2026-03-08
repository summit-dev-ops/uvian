import React, { Suspense } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar,
} from '~/components/shared/ui/pages/page-container';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { SpaceNotesPageBreadcrumb } from '~/components/features/notes/components/pages/breadcrumbs/space-notes-page-breadcrumb';
import { NotesInterface } from '~/components/features/notes/components/interfaces/notes-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import {
  NotesPageActionProvider,
  NotesPageActions,
} from '~/components/features/notes/components/pages/actions/notes-page-action-provider';

export default async function SpaceNotesPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <ModalProvider>
      <NotesPageActionProvider spaceId={spaceId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <SpaceNotesPageBreadcrumb spaceId={spaceId} />
                <PageActions>
                  <NotesPageActions spaceId={spaceId} />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <Suspense fallback={<div>Loading notes...</div>}>
                  <NotesInterface spaceId={spaceId} />
                </Suspense>
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </NotesPageActionProvider>
    </ModalProvider>
  );
}
