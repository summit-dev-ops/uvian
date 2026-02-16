'use client';

import React from 'react';
import { SettingsEditor } from '../settings-editor';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { userQueries } from '~/lib/domains/user/api';
import { useQuery } from '@tanstack/react-query';

export function SettingsInterface() {
  const { isLoading: isLoadingSettings, error: settingsError } = useQuery(
    userQueries.settings()
  );

  // Handle successful save
  const handleSave = () => {
    // Could show a success toast here
  };

  // Handle cancel editing
  const handleCancel = () => {
    // Could reset form or navigate away
  };

  // Early return for loading state
  if (isLoadingSettings) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Settings"
            subtitle="Loading your settings..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading your settings..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for error state
  if (settingsError) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Settings"
            subtitle="Authentication required"
            actions={
              <button
                onClick={() => window.history.back()}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Back
              </button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Authentication Required"
            message="You need to be signed in to view your settings."
            showRetry={true}
            showHome={false}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceHeader spacing="compact">
        <InterfaceHeaderContent
          title="Settings"
          subtitle="Manage your account preferences and configuration"
        />
      </InterfaceHeader>
      <InterfaceContent spacing="default">
        <SettingsEditor
          className="p-2"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </InterfaceContent>
    </InterfaceLayout>
  );
}
