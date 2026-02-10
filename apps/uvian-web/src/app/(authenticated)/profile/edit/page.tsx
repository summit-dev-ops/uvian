import React from 'react';
import { ProfileEditPageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs';
import { ProfileEditInterface } from '~/components/features/user/components/interfaces/profile-edit-interface';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await params;

  return (
    <PageContainer className="flex flex-1 flex-col min-h-0 relative">
      <PageHeader className="flex flex-row flex-1 items-center justify-between">
        <ProfileEditPageBreadcrumb />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ProfileEditInterface />
      </PageContent>
    </PageContainer>
  );
}
