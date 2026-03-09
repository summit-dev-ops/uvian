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
import { AccountMembersPageBreadcrumb } from '~/components/features/accounts/components/pages/breadcrumbs/account-members-breadcrumb';
import { AccountMembersInterface } from '~/components/features/accounts/components/interfaces/account-members-interface';
import { ModalProvider } from '~/components/shared/ui/modals';
import { AccountMembersPageActionProvider } from '~/components/features/accounts/components/pages/actions/account-members-page-action-provider';
import { AccountMembersPageActions } from '~/components/features/accounts/components/pages/actions/account-members-page-actions';

interface AccountMembersPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountMembersPage({
  params,
}: AccountMembersPageProps) {
  const { accountId } = await params;

  return (
    <ModalProvider>
      <AccountMembersPageActionProvider accountId={accountId}>
        <PageWrapper>
          <PageWrapperSidebar />
          <PageWrapperContent>
            <PageContainer className="flex flex-1 flex-col min-h-0 relative">
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <AccountMembersPageBreadcrumb accountId={accountId} />
                <PageActions>
                  <AccountMembersPageActions accountId={accountId} />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <AccountMembersInterface accountId={accountId} />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </AccountMembersPageActionProvider>
    </ModalProvider>
  );
}
