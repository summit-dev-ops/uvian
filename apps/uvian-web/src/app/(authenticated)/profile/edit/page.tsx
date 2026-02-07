import React from 'react';
import { ProfileEditPageBreadcrumb } from '~/components/features/user/components/profile-edit-breadcrumb';
import { ProfileEditView } from '~/components/features/user/components/views/profile-edit-view';
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
      <PageHeader>
        <ProfileEditPageBreadcrumb />
      </PageHeader>
      <PageContent className="flex flex-1 flex-col min-h-0 relative">
        <ProfileEditView />
      </PageContent>
    </PageContainer>
  );
}
