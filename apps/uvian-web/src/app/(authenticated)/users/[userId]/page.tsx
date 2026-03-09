import * as React from 'react';
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
import { UserPageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs/user-breadcrumb';
import { UserProfileInterface } from '~/components/features/user/components/interfaces/user-profile-interface';
import { UserPageActionProvider } from '~/components/features/user/components/pages/actions/user-page-action-provider';
import { UserPageActions } from '~/components/features/user/components/pages/actions/user-page-actions';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <ModalProvider>
      <UserPageActionProvider userId={userId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <UserPageBreadcrumb userId={userId} />
                <PageActions>
                  <UserPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <UserProfileInterface userId={userId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </UserPageActionProvider>
    </ModalProvider>
  );
}
