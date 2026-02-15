'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsEditor } from '../settings-editor';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoadingSkeleton } from '~/components/shared/ui/interfaces/interface-loading';
import { userQueries } from '~/lib/domains/user/api';
import { useQuery } from '@tanstack/react-query';

// Import new layout components
import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
} from '~/components/shared/ui/interfaces/interface-layout';

export function SettingsInterface() {
  const router = useRouter();
  const { isLoading: isLoadingSettings, error: settingsError } = useQuery(
    userQueries.settings()
  );

  // Handle navigation back to previous page
  const handleBack = () => {
    router.back();
  };

  // Handle successful save
  const handleSave = () => {
    // Could show a success toast here
  };

  // Handle cancel editing
  const handleCancel = () => {
    // Could reset form or navigate away
  };

  // Loading state while checking authentication
  if (isLoadingSettings) {
    return (
      <InterfaceLayout>
        <InterfaceContainer variant="card" size="default">
          <InterfaceHeader>
            <InterfaceHeaderContent title="Settings" />
          </InterfaceHeader>
          <InterfaceContent>
            <InterfaceSection variant="card">
              <InterfaceLoadingSkeleton
                variant="default"
                lines={4}
                className="flex flex-col space-y-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </InterfaceLoadingSkeleton>
            </InterfaceSection>
          </InterfaceContent>
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  // Error state (authentication issue)
  if (settingsError) {
    return (
      <InterfaceError
        variant="card"
        title="Authentication Required"
        message="You need to be signed in to view your settings."
        showRetry={true}
        showHome={false}
        onRetry={() => window.location.reload()}
        className="text-center space-y-6 max-w-md mx-auto p-6"
      />
    );
  }

  return (
    <ScrollArea className="flex-1">
      <SettingsEditor
        className="p-2"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </ScrollArea>
  );
}
