'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

export interface UserEditPageActionContextType {
  userId: string;
  readonly ACTION_CANCEL: 'cancel';
}

interface UserEditPageActionProviderProps {
  userId: string;
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const EDIT_ACTION_IDS = {
  CANCEL: 'cancel',
} as const;

export function UserEditPageActionProvider({
  userId,
  children,
  onError,
  onSuccess,
}: UserEditPageActionProviderProps) {
  const router = useRouter();

  const handleCancel = React.useCallback(async () => {
    try {
      router.push(`/users/${userId}`);
    } catch (error) {
      console.error('Failed to navigate back to user profile:', error);
      throw error;
    }
  }, [router, userId]);

  const actions: ActionRegistrationType[] = [
    {
      id: EDIT_ACTION_IDS.CANCEL,
      label: 'Cancel',
      handler: handleCancel,
    },
  ];

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

export function useUserEditPageActionContext() {
  const context = React.useContext(
    React.createContext<UserEditPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useUserEditPageActionContext must be used within a UserEditPageActionProvider'
    );
  }
  return context;
}
