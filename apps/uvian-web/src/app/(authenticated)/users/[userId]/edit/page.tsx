'use client';

import React, { use } from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { UserEditPageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs/user-breadcrumb';
import { UserProfileEditInterface } from '~/components/features/user/components/interfaces/user-profile-edit-interface';
import { UserEditPageActionProvider } from '~/components/features/user/components/pages/actions/user-edit-page-action-provider';
import { ModalProvider } from '~/components/shared/ui/modals';

export default function UserProfileEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  return (
    <ModalProvider>
      <UserEditPageActionProvider userId={userId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <UserEditPageBreadcrumb userId={userId} />
                <PageActions />
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <UserProfileEditInterface userId={userId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </UserEditPageActionProvider>
    </ModalProvider>
  );
}
