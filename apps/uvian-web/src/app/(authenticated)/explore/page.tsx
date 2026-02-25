import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { InnerSidebar } from '~/components/shared/ui/sidebar/inner-sidebar';
import { ExploreSidebar } from '~/components/features/explore/components/pages/sidebar';
import { ExploreBreadcrumb } from '~/components/features/explore/components/pages/breadcrumbs/explore-breadcrumb';

export default function ExplorePage() {
  return (
    <div className="flex flex-1 min-h-0">
      <InnerSidebar>
        <ExploreSidebar />
      </InnerSidebar>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ExploreBreadcrumb />
          <PageActions />
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Explore page coming soon...</p>
          </div>
        </PageContent>
      </PageContainer>
    </div>
  );
}
