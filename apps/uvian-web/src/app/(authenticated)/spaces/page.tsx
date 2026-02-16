import React from 'react';
import { SpacesListInterface } from '~/components/features/spaces/components/interfaces/spaces-list-interface';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/ui/pages/page-container';
import { PageActions } from '~/components/shared/ui/pages/page-header/page-actions';
import { PageModals } from '~/components/shared/ui/modals/page-modals';
import { SpacesPageBreadcrumb } from '~/components/features/spaces/components/pages/breadcrumbs';
import {
  SpacesListPageActionProvider,
  SpacesListPageActions,
} from '~/components/features/spaces/components/pages/actions';
import { ModalProvider } from '~/components/shared/ui/modals';

export default async function SpacesPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  return (
    <ModalProvider>
      <SpacesListPageActionProvider>
        <PageContainer
          size={'full'}
          className="flex flex-1 flex-col min-h-0 relative"
        >
          <PageHeader className="flex flex-row flex-1 items-center justify-between">
            <SpacesPageBreadcrumb />
            <PageActions>
              <SpacesListPageActions />
            </PageActions>
          </PageHeader>
          <PageContent className="flex flex-1 flex-col min-h-0 relative">
            <SpacesListInterface />
          </PageContent>
          <PageModals />
        </PageContainer>
      </SpacesListPageActionProvider>
    </ModalProvider>
  );
}
