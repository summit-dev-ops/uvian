import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { ExploreBreadcrumb } from '~/components/features/explore/components/pages/breadcrumbs/explore-breadcrumb';

export default function ExplorePage() {
  return (
    <PageWrapper>
      <PageWrapperSidebar />
      <PageWrapperContent>
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
              <p className="text-muted-foreground">
                Explore page coming soon...
              </p>
            </div>
          </PageContent>
        </PageContainer>
      </PageWrapperContent>
    </PageWrapper>
  );
}
