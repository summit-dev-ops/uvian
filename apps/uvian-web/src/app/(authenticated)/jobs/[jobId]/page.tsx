import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { JobDetailPageBreadcrumb } from '~/components/features/jobs/components/pages/breadcrumbs/job-page-breadcrumb';

import { JobInterface } from '~/components/features/jobs/components/interfaces/job-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <ModalProvider>
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
    </ModalProvider>
  );
}
