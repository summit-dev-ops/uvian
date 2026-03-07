'use client';

import React, { use } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import {
  SpaceEditPageActionProvider,
  SpaceEditPageActions,
} from '~/components/features/spaces/components/pages/actions';
import { SpaceEditPageBreadcrumb } from '~/components/features/spaces/components/pages/breadcrumbs';
import { SpaceEditInterface } from '~/components/features/spaces/components/interfaces/space-edit-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default function SpaceEditPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);

  return (
    <ModalProvider>
      <SpaceEditPageActionProvider spaceId={spaceId}>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <SpaceEditPageBreadcrumb spaceId={spaceId} />
                <PageActions>
                  <SpaceEditPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <SpaceEditInterface spaceId={spaceId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </SpaceEditPageActionProvider>
    </ModalProvider>
  );
}
