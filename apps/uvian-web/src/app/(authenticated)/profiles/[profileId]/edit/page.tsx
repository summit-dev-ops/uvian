import React from 'react';
import { ProfileEditPageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profile-edit-breadcrumb';
import { ProfileEditInterface } from '~/components/features/profiles/components/interfaces/profile-edit-interface';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return (
    <PageContainer className="flex flex-1 flex-col min-h-0 relative">
      <PageHeader className="flex flex-row flex-1 items-center justify-between">
        <ProfileEditPageBreadcrumb profileId={profileId} />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ProfileEditInterface profileId={profileId} />
      </PageContent>
    </PageContainer>
  );
}
