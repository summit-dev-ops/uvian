import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { JobDetailPageBreadcrumb } from '~/components/features/jobs/components/pages/breadcrumbs/job-page-breadcrumb';

import { JobInterface } from '~/components/features/jobs/components/interfaces/job-interface';
import { ModalProvider, PageModals } from '~/components/shared/ui/modals';
import {
  JobPageActionProvider,
  JobPageActions,
} from '~/components/features/jobs/components/pages/actions';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <ModalProvider>
      <JobPageActionProvider jobId={jobId}>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <JobDetailPageBreadcrumb jobId={jobId} />
                <PageActions>
                  <JobPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <JobInterface jobId={jobId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </JobPageActionProvider>
    </ModalProvider>
  );
}
