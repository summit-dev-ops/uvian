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
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

interface JobsListInterfaceProps {
  spaceId?: string;
  conversationId?: string;
  BreadcrumbComponent?: AnyComponent;
}

export function JobsListInterface({
  spaceId,
  conversationId,
  BreadcrumbComponent,
}: JobsListInterfaceProps) {
  const { activeProfileId } = useUserSessionStore();

  const filters = {
    authProfileId: activeProfileId ?? '',
    ...(spaceId ? { spaceId } : {}),
    ...(conversationId ? { conversationId } : {}),
  };

  return (
    <ModalProvider>
      <JobsListPageActionProvider>
        <PageContainer
          size={'full'}
          className="flex flex-1 flex-col min-h-0 relative"
        >
          <PageHeader className="flex flex-row flex-1 items-center justify-between">
            {BreadcrumbComponent && (
              <BreadcrumbComponent
                spaceId={spaceId}
                conversationId={conversationId}
              />
            )}
            <PageActions>
              <JobsListPageActions />
            </PageActions>
          </PageHeader>
          <PageContent className="flex flex-1 flex-col min-h-0 relative">
            <JobDataTable filters={filters} />
          </PageContent>
          <PageModals />
        </PageContainer>
      </JobsListPageActionProvider>
    </ModalProvider>
  );
}
