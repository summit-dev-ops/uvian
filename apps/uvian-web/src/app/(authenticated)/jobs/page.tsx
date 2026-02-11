
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

import { JobDataTable } from '~/components/features/jobs';
import { JobsPageBreadcrumb } from '~/components/features/jobs/components/pages/breadcrumbs/jobs-page-breadcrumb';

export default async function Page() {

  return (
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
  );
}
