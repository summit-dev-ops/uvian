import React from 'react';
import { ProfileEditPageBreadcrumb } from '~/components/features/profiles/components/pages/breadcrumbs/profile-edit-breadcrumb';
import { ProfileEditInterface } from '~/components/features/profiles/components/interfaces/profile-edit-interface';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return (
    <ModalProvider>
      <PageContainer className="flex flex-1 flex-col min-h-0 relative">
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ProfileEditPageBreadcrumb profileId={profileId} />
          <PageActions></PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ProfileEditInterface profileId={profileId} />
        </PageContent>
      </PageContainer>
    </ModalProvider>
  );
}
