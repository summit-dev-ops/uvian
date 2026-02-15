import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/pages/page-actions/page-modals';
import {
  SupportPageActionProvider,
  SupportPageActions,
} from '~/components/features/support/components/pages/actions';
import { SupportBreadcrumb } from '~/components/features/support/components/pages/breadcrumbs';
import { SearchInterface } from '~/components/features/support/components/interfaces/search-interface';

export default async function SearchSupportPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the search page

  return (
    <SupportPageActionProvider>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <SupportBreadcrumb />
          <PageActions>
            <SupportPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <SearchInterface />
        </PageContent>
        <PageModals />
      </PageContainer>
    </SupportPageActionProvider>
  );
}
