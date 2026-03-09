'use client';

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
import { AccountPageBreadcrumb } from '~/components/features/accounts/components/pages/breadcrumbs/account-breadcrumb';
import { AccountInterface } from '~/components/features/accounts/components/interfaces/account-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { AccountPageActionProvider } from '~/components/features/accounts/components/pages/actions/account-page-action-provider';
import { AccountPageActions } from '~/components/features/accounts/components/pages/actions/account-page-actions';

interface AccountPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await params;

  return (
    <ModalProvider>
      <AccountPageActionProvider>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AccountPageBreadcrumb accountId={accountId} />
                <PageActions>
                  <AccountPageActions accountId={accountId} />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AccountInterface accountId={accountId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AccountPageActionProvider>
    </ModalProvider>
  );
}
