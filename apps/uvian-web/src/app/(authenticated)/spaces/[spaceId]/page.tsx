import React from 'react';
import { SpacePageBreadcrumb } from '~/components/features/spaces/components/breadcrumbs/space-page-breadcrumb';
import { SpaceView } from '~/components/features/spaces/components/views/space-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader>
        <SpacePageBreadcrumb spaceId={spaceId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <SpaceView spaceId={spaceId} />
      </PageContent>
    </PageContainer>
  );
}
