import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import {
  SpaceOverviewPageActionProvider,
  SpaceOverviewPageActions,
} from '~/components/features/spaces/components/pages/actions';
import { SpacePageBreadcrumb } from '~/components/features/spaces/components/pages/breadcrumbs';
import { SpaceInterface } from '~/components/features/spaces/components/interfaces/space-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { InnerSidebar } from '~/components/shared/ui/sidebar/inner-sidebar';
import { SpacesSidebar } from '~/components/features/spaces/components/pages/sidebar';

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <ModalProvider>
      <SpaceOverviewPageActionProvider spaceId={spaceId}>
        <div className="flex flex-1 min-h-0">
          <InnerSidebar>
            <SpacesSidebar spaceId={spaceId} />
          </InnerSidebar>
          <PageContainer
            size={'full'}
            className="flex flex-1 flex-col min-h-0 relative"
          >
            <PageHeader className="flex flex-row flex-1 items-center justify-between">
              <SpacePageBreadcrumb spaceId={spaceId} />
              <PageActions>
                <SpaceOverviewPageActions />
              </PageActions>
            </PageHeader>
            <PageContent className="flex flex-1 flex-col min-h-0 relative">
              <SpaceInterface spaceId={spaceId} />
            </PageContent>
            <PageModals />
          </PageContainer>
        </div>
      </SpaceOverviewPageActionProvider>
    </ModalProvider>
  );
}
