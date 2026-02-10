'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsEditor } from '../settings-editor';
import { useProfile } from '../../hooks/use-profile';
import { ScrollArea } from '@org/ui';

export function SettingsInterface() {
  const router = useRouter();
  const { isLoadingSettings, settingsError } = useProfile();

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
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-10 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Error state (authentication issue)
  if (settingsError) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <div className="h-8 w-8 bg-destructive/30 rounded" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground mt-2">
            You need to be signed in to view your settings.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
          <button
            onClick={handleBack}
            className="w-full px-4 py-2 border rounded-md hover:bg-accent"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <SettingsEditor
        className='p-2'
        onSave={handleSave}
        onCancel={handleCancel} 
      />
    </ScrollArea>
  );
}
