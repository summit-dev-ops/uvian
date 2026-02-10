'use client';

import React from 'react';
import { SettingsInterface } from '~/components/features/user/components/interfaces/settings-interface';
import {
  PageContainer,
  PageContent,
  PageHeader,
} from '~/components/shared/navigation/ui/page-container';
import { PageActions } from '~/components/shared/page-header/page-actions';
import { PageModals } from '~/components/shared/page-actions/page-modals';
import {
  SettingsPageActionProvider,
  SettingsPageActions,
} from '~/components/features/user/components/pages/actions';
import { SettingsPageBreadcrumb } from '~/components/features/user/components/pages/breadcrumbs';

export default function SettingsPage({
  params,
}: {
  params: Promise<Record<string, never>>;
}) {
  // No params to unwrap for the settings page

  return (
    <SettingsPageActionProvider>
      <PageContainer className="flex flex-1 flex-col min-h-0 relative">
        <PageHeader className="flex flex-row flex-1 items-center justify-between">
          <SettingsPageBreadcrumb />
          <PageActions>
            <SettingsPageActions />
          </PageActions>
        </PageHeader>
        <PageContent className="flex flex-1 flex-col min-h-0 relative">
          <SettingsInterface />
        </PageContent>
        <PageModals />
      </PageContainer>
    </SettingsPageActionProvider>
  );
}
