
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { JobDetailPageBreadcrumb } from '~/components/features/jobs/components/pages/breadcrumbs/job-page-breadcrumb';

import { JobInterface } from '~/components/features/jobs/components/interfaces/job-interface';

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <PageContainer
      size={'full'}
      className="flex flex-1 flex-col min-h-0 relative"
    >
      <PageHeader className="flex flex-row flex-1 items-center justify-between">
        <JobDetailPageBreadcrumb jobId={jobId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <JobInterface jobId={jobId} />
      </PageContent>
    </PageContainer>
  );
}
