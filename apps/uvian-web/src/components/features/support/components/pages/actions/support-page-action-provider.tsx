'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/page-actions/page-action-context';

interface SupportPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SUPPORT_ACTION_IDS = {
  REFRESH_SUPPORT: 'refresh-support',
  CONTACT_SUPPORT: 'contact-support',
} as const;

export function SupportPageActionProvider({
  children,
  onError,
  onSuccess,
}: SupportPageActionProviderProps) {
  // Handler for refresh action
  const handleRefreshSupport = React.useCallback(async () => {
    // For now, just refresh the page - could be extended to refresh support data
    window.location.reload();
  }, []);

  // Handler for contact support action
  const handleContactSupport = React.useCallback(async () => {
    // Open contact support modal or redirect to contact form
    // This could open a modal, redirect to contact page, etc.
    console.log('Contact support action triggered');
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: SUPPORT_ACTION_IDS.CONTACT_SUPPORT,
      label: 'Contact Support',
      icon: RefreshCw, // Placeholder icon - should be a help or message icon
      handler: handleContactSupport,
    },
    {
      id: SUPPORT_ACTION_IDS.REFRESH_SUPPORT,
      label: 'Refresh',
      icon: RefreshCw,
      handler: handleRefreshSupport,
    },
  ];

  // Success and error handlers for the PageActionProvider
  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useSupportPageActionContext() {
  const context = React.useContext(
    React.createContext<typeof SUPPORT_ACTION_IDS | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSupportPageActionContext must be used within a SupportPageActionProvider'
    );
  }
  return context;
}
