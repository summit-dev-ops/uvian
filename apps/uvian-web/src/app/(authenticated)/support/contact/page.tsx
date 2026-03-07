import React from 'react';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageWrapper,
  PageWrapperContent,
  PageWrapperSidebar
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import {
  SupportPageActionProvider,
  SupportPageActions,
} from '~/components/features/support/components/pages/actions';
import { SupportBreadcrumb } from '~/components/features/support/components/pages/breadcrumbs';
import { ContactInterface } from '~/components/features/support/components/interfaces/contact-interface';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function ContactSupportPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the contact page

  return (
    <ModalProvider>
      <SupportPageActionProvider>
        <PageWrapper>
          <PageWrapperSidebar/>
          <PageWrapperContent>
            <PageContainer
              size={'full'}
              className="flex flex-1 flex-col min-h-0 relative"
            >
              <PageHeader className="flex flex-row flex-1 items-center justify-between">
                <SupportBreadcrumb />
                <PageActions>
                  <SupportPageActions />
                </PageActions>
              </PageHeader>
              <PageContent className="flex flex-1 flex-col min-h-0 relative">
                <ContactInterface />
              </PageContent>
              <PageModals />
            </PageContainer>
          </PageWrapperContent>
        </PageWrapper>
      </SupportPageActionProvider>
    </ModalProvider>
  );
}
