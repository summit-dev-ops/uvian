import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { ProfilePageActionProvider } from '~/components/features/profiles/components/pages/actions/profile-page-action-provider';
import { ProfilePageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profile-breadcrumb';
import { ProfileInterface } from '~/components/features/profiles/components/interfaces/profile-interface';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { ProfilePageActions } from '~/components/features/profiles/components/pages/actions';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return (
    <ModalProvider>
      <ProfilePageActionProvider profileId={profileId}>
        <PageContainer className="flex flex-1 flex-col min-h-0 relative">
          <PageHeader className="flex flex-row flex-1 items-center justify-between">
            <ProfilePageBreadcrumb profileId={profileId} />
            <PageActions>
              <ProfilePageActions />
            </PageActions>
          </PageHeader>
          <PageContent className="flex flex-1 flex-col min-h-0 relative">
            <ProfileInterface profileId={profileId} />
          </PageContent>
        </PageContainer>
      </ProfilePageActionProvider>
    </ModalProvider>
  );
}
