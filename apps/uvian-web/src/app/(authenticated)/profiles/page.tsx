import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/pages/page-actions/page-modals';
import { ProfilesListPageActionProvider } from '~/components/features/profiles/components/pages/actions/profiles-list-page-action-provider';
import { ProfilesListPageActions } from '~/components/features/profiles/components/pages/actions/profiles-list-page-actions';
import { ProfilesPageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profiles-breadcrumb';
import { ProfilesListInterface } from '~/components/features/profiles/components/interfaces/profiles-list-interface';

export default async function ProfilesPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the profiles listing page

  return (
    <ProfilesListPageActionProvider>
      <PageContainer
        size={'full'}
        className="flex flex-1 flex-col min-h-0 relative"
      >
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ProfilesPageBreadcrumb />
          <PageActions>
            <ProfilesListPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ProfilesListInterface />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ProfilesListPageActionProvider>
  );
}
