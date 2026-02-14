import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { ProfilePageActionProvider } from '~/components/features/profiles/components/pages/actions/profile-page-action-provider';
import { ProfilePageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profile-breadcrumb';
import { ProfileInterface } from '~/components/features/profiles/components/interfaces/profile-interface';

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
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ProfileInterface profileId={profileId} />
        </PageContent>
      </PageContainer>
    </ProfilePageActionProvider>
  );
}
