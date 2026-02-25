'use client';

import * as React from 'react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileMutations } from '~/lib/domains/profile/api';
import { ProfileUI } from '~/lib/domains/profile/types';

interface ProfilesListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const PROFILES_LIST_ACTION_IDS = {
  CREATE_PROFILE: 'create-profile',
  REFRESH_PROFILES: 'refresh-profiles',
  SEARCH_PROFILES: 'search-profiles',
  FILTER_PROFILES: 'filter-profiles',
} as const;

export function ProfilesListPageActionProvider({
  children,
  onError,
  onSuccess,
}: ProfilesListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { mutate: createProfile } = useMutation(
    profileMutations.createProfile(queryClient)
  );

  // Handler for create profile action
  const handleCreateProfile = React.useCallback(async (data: ProfileUI) => {
    try {
      // Use the mutation which includes optimistic updates and navigation
      createProfile({
        profileId: crypto.randomUUID(),
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        publicFields: data.publicFields,
        type: data.type,
      });
    } catch (error) {
      console.error('Failed to create space:', error);
      throw error;
    }
  }, []);

  // Handler for refresh action
  const handleRefreshProfiles = React.useCallback(async () => {
    // Refresh the profiles list
    console.log('Refresh profiles action triggered');
    // This could invalidate queries and refetch data
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: PROFILES_LIST_ACTION_IDS.CREATE_PROFILE,
      label: 'Create Profile',
      handler: handleCreateProfile,
    },
    {
      id: PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES,
      label: 'Refresh',
      handler: handleRefreshProfiles,
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

export function useProfilesListPageActionContext() {
  const context = React.useContext(
    React.createContext<typeof PROFILES_LIST_ACTION_IDS | null>(null)
  );
  if (!context) {
    throw new Error(
      'useProfilesListPageActionContext must be used within a ProfilesListPageActionProvider'
    );
  }
  return context;
}
