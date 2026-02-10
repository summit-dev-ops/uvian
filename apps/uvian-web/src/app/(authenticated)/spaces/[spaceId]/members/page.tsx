
import React, { Suspense } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';
import { SpaceMembersPageActionProvider, SpaceMembersPageActions } from '~/components/features/spaces/components/pages/actions';
import { SpaceMembersPageBreadcrumb } from '~/components/features/spaces/components/pages/breadcrumbs';
import { SpaceMembersInterface } from '~/components/features/spaces/components/interfaces/space-members-interface';

export default async function SpaceMembersPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <SpaceMembersPageActionProvider spaceId={spaceId}>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <SpaceMembersPageBreadcrumb spaceId={spaceId} />
          <PageActions>
            <SpaceMembersPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <Suspense fallback={<div>Loading space members...</div>}>
            <SpaceMembersInterface spaceId={spaceId} />
          </Suspense>
        </PageContent>
        <PageModals />
      </PageContainer>
    </SpaceMembersPageActionProvider>
  );
}
