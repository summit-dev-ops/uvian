import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';

import { JobDataTable } from '~/components/features/jobs';
import { JobsPageBreadcrumb } from '~/components/features/jobs/components/pages/breadcrumbs/jobs-page-breadcrumb';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function Page() {
  return (
    <ModalProvider>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <JobsPageBreadcrumb />
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <JobDataTable />
        </PageContent>
      </PageContainer>
    </ModalProvider>
  );
}
