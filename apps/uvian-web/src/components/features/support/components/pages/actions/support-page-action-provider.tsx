'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

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
  const router = useRouter();
  const handleRefreshSupport = React.useCallback(async () => {
    router.refresh();
  }, []);

  const handleContactSupport = React.useCallback(async () => {
    console.log('Contact support action triggered');
  }, []);

  const actions: ActionRegistrationType[] = [
    {
      id: SUPPORT_ACTION_IDS.CONTACT_SUPPORT,
      label: 'Contact Support',
      handler: handleContactSupport,
    },
    {
      id: SUPPORT_ACTION_IDS.REFRESH_SUPPORT,
      label: 'Refresh',
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
