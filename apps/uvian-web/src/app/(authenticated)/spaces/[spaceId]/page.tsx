
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/pages/page-actions/page-modals';
import { SpaceOverviewPageActionProvider, SpaceOverviewPageActions } from '~/components/features/spaces/components/pages/actions';
import { SpacePageBreadcrumb } from '~/components/features/spaces/components/pages/breadcrumbs';
import { SpaceInterface } from '~/components/features/spaces/components/interfaces/space-interface';

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <SpaceOverviewPageActionProvider spaceId={spaceId}>
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
    </SpaceOverviewPageActionProvider>
  );
}
