import React from 'react';
import { ProfilePageBreadcrumb } from '~/components/features/user/components/profile-breadcrumb';
import { ProfileView } from '~/components/features/user/components/views/profile-view';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function ProfilePage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await params;

  return (
    <PageContainer className="flex flex-1 flex-col min-h-0 relative">
      <PageHeader>
        <ProfilePageBreadcrumb />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ProfileView />
      </PageContent>
    </PageContainer>
  );
}
