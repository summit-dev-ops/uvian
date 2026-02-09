import React from 'react';
import { SpacesPageBreadcrumb } from '~/components/features/spaces/components/breadcrumbs/spaces-page-breadcrumb';
import { SpacesView } from '~/components/features/spaces/components/views/spaces-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function SpacesPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await params;

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader>
        <SpacesPageBreadcrumb />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <SpacesView />
      </PageContent>
    </PageContainer>
  );
}
