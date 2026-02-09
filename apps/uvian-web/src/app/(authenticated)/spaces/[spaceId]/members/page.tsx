'use client';

import React, { Suspense, use } from 'react';
import { SpaceMembersPageBreadcrumb } from '~/components/features/spaces/components/breadcrumbs/space-members-page-breadcrumb';
import { SpaceMembersView } from '~/components/features/spaces/components/views/space-members-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default function SpaceMembersPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader>
        <SpaceMembersPageBreadcrumb spaceId={spaceId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <Suspense fallback={<div>Loading space members...</div>}>
          <SpaceMembersView spaceId={spaceId} />
        </Suspense>
      </PageContent>
    </PageContainer>
  );
}
