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
import { AccountsPageBreadcrumb } from '~/components/features/accounts/components/pages/breadcrumbs/accounts-breadcrumb';
import { AccountsListInterface } from '~/components/features/accounts/components/interfaces/accounts-list-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { AccountsListPageActionProvider } from '~/components/features/accounts/components/pages/actions/accounts-list-page-action-provider';
import { AccountsListPageActions } from '~/components/features/accounts/components/pages/actions/accounts-list-page-actions';

export default async function AccountsPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  return (
    <ModalProvider>
      <AccountsListPageActionProvider>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AccountsPageBreadcrumb />
                <PageActions>
                  <AccountsListPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AccountsListInterface />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AccountsListPageActionProvider>
    </ModalProvider>
  );
}
