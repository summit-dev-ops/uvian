'use client';

import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';

import { ModalProvider, PageModals } from '~/components/shared/ui/modals';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import {
  JobsListPageActionProvider,
  JobsListPageActions,
} from '~/components/features/jobs/components/pages/actions';
import { JobDataTable } from '~/components/features/jobs/components/job-data-table';
import { ConversationJobsBreadcrumb } from './breadcrumb';

interface ConversationJobsPageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationJobsPage({
  params,
}: ConversationJobsPageProps) {
  const { conversationId } = React.use(params);

  return (
    <ModalProvider>
      <JobsListPageActionProvider>
        <PageContainer
          size={'full'}
          className="flex flex-1 flex-col min-h-0 relative"
        >
          <PageHeader className="flex flex-row flex-1 items-center justify-between">
            <ConversationJobsBreadcrumb conversationId={conversationId} />
            <PageActions>
              <JobsListPageActions />
            </PageActions>
          </PageHeader>
          <PageContent className="flex flex-1 flex-col min-h-0 relative">
            <JobDataTable
              filters={{
                conversationId,
              }}
            />
          </PageContent>
          <PageModals />
        </PageContainer>
      </JobsListPageActionProvider>
    </ModalProvider>
  );
}
