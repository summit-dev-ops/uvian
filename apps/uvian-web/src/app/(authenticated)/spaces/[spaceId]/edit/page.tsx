import React from 'react';
import { SpaceEditPageBreadcrumb } from '~/components/features/spaces/components/breadcrumbs/space-edit-page-breadcrumb';
import { SpaceEditView } from '~/components/features/spaces/components/views/space-edit-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function SpaceEditPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  return (
    <PageContainer className="flex flex-1 flex-col min-h-0 relative">
      <PageHeader>
        <SpaceEditPageBreadcrumb spaceId={spaceId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <SpaceEditView spaceId={spaceId} />
      </PageContent>
    </PageContainer>
  );
}