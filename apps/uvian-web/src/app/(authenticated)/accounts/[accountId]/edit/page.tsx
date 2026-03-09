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
import { AccountEditPageBreadcrumb } from '~/components/features/accounts/components/pages/breadcrumbs/account-edit-breadcrumb';
import { AccountEditInterface } from '~/components/features/accounts/components/interfaces/account-edit-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { AccountEditPageActionProvider } from '~/components/features/accounts/components/pages/actions/account-edit-page-action-provider';
import { AccountEditPageActions } from '~/components/features/accounts/components/pages/actions/account-edit-page-actions';

interface AccountEditPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountEditPage({
  params,
}: AccountEditPageProps) {
  const { accountId } = await params;

  return (
    <ModalProvider>
      <AccountEditPageActionProvider accountId={accountId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AccountEditPageBreadcrumb accountId={accountId} />
                <PageActions>
                  <AccountEditPageActions accountId={accountId} />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AccountEditInterface accountId={accountId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AccountEditPageActionProvider>
    </ModalProvider>
  );
}
