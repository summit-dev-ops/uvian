
import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';
import { ProfilePageActionProvider, ProfilePageActions } from '~/components/features/user/components/pages/actions';
import { ProfilePageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs';
import { ProfileInterface } from '~/components/features/user/components/interfaces/profile-interface';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return (
    <ProfilePageActionProvider profileId={profileId}>
      <PageContainer className="flex flex-1 flex-col min-h-0 relative">
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ProfilePageBreadcrumb profileId={profileId} />
          <PageActions>
            <ProfilePageActions/>
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ProfileInterface profileId={profileId}/>
        </PageContent>
        <PageModals />
      </PageContainer>
    </ProfilePageActionProvider>
  );
}
