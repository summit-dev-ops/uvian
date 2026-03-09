'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

export interface UserPageActionContextType {
  userId: string;
  readonly ACTION_EDIT_PROFILE: 'edit-profile';
}

interface UserPageActionProviderProps {
  userId: string;
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const USER_ACTION_IDS = {
  EDIT_PROFILE: 'edit-profile',
} as const;

const UserPageActionContext =
  React.createContext<UserPageActionContextType | null>(null);

export function UserPageActionProvider({
  userId,
  children,
  onError,
  onSuccess,
}: UserPageActionProviderProps) {
  const router = useRouter();

  const handleEditProfile = React.useCallback(async () => {
    try {
      router.push(`/users/${userId}/edit`);
    } catch (error) {
      console.error('Failed to start editing profile:', error);
      throw error;
    }
  }, [router, userId]);

  const actions: ActionRegistrationType[] = [
    {
      id: USER_ACTION_IDS.EDIT_PROFILE,
      label: 'Edit Profile',
      handler: handleEditProfile,
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
    <UserPageActionContext.Provider
      value={{
        userId,
        ACTION_EDIT_PROFILE: 'edit-profile',  
      }}
    >
      <PageActionProvider
        actions={actions}
        onActionError={handleActionError}
        onActionSuccess={handleActionSuccess}
      >
        {children}
      </PageActionProvider>
    </UserPageActionContext.Provider>
  );
}

export function useUserPageActionContext() {
  const context = React.useContext(UserPageActionContext);
  if (!context) {
    throw new Error(
      'useUserPageActionContext must be used within a UserPageActionProvider'
    );
  }
  return context;
}
