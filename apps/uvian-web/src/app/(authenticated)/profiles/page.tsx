import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { ProfilesListPageActionProvider } from '~/components/features/profiles/components/pages/actions/profiles-list-page-action-provider';
import { ProfilesListPageActions } from '~/components/features/profiles/components/pages/actions/profiles-list-page-actions';
import { ProfilesPageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profiles-breadcrumb';
import { ProfilesListInterface } from '~/components/features/profiles/components/interfaces/profiles-list-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function ProfilesPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the profiles listing page

  return (
    <ModalProvider>
      <ProfilesListPageActionProvider>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
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
          </PageWrapperContent>
        </PageWrapper>
      </ProfilesListPageActionProvider>
    </ModalProvider>
  );
}
