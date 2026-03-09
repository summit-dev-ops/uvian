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
import { UsersPageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs/users-breadcrumb';
import { UsersListPageActionProvider } from '~/components/features/user/components/pages/actions/users-list-page-action-provider';
import { UsersListInterface } from '~/components/features/user/components/interfaces/users-list-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function UsersPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  return (
    <ModalProvider>
      <UsersListPageActionProvider>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <UsersPageBreadcrumb />
                <PageActions/>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <UsersListInterface />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </UsersListPageActionProvider>
    </ModalProvider>
  );
}
