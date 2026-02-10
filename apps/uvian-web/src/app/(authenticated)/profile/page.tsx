'use client';

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

export default function ProfilePage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the profile page

  return (
    <ProfilePageActionProvider>
      <PageContainer className="flex flex-1 flex-col min-h-0 relative">
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <ProfilePageBreadcrumb />
          <PageActions>
            <ProfilePageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <ProfileInterface />
        </PageContent>
        <PageModals />
      </PageContainer>
    </ProfilePageActionProvider>
  );
}
