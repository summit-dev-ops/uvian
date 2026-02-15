'use client';

import * as React from 'react';
import { Plus, RefreshCw, Filter, Search } from 'lucide-react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

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
  // Handler for create profile action
  const handleCreateProfile = React.useCallback(async () => {
    // Navigate to profile creation or open create profile modal
    console.log('Create profile action triggered');
    // This could open a modal, redirect to creation page, etc.
  }, []);

  // Handler for refresh action
  const handleRefreshProfiles = React.useCallback(async () => {
    // Refresh the profiles list
    console.log('Refresh profiles action triggered');
    // This could invalidate queries and refetch data
  }, []);

  // Handler for search action
  const handleSearchProfiles = React.useCallback(async () => {
    // Open search interface or focus search field
    console.log('Search profiles action triggered');
  }, []);

  // Handler for filter action
  const handleFilterProfiles = React.useCallback(async () => {
    // Open filter options or toggle filter panel
    console.log('Filter profiles action triggered');
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: PROFILES_LIST_ACTION_IDS.CREATE_PROFILE,
      label: 'Create Profile',
      icon: Plus,
      handler: handleCreateProfile,
    },
    {
      id: PROFILES_LIST_ACTION_IDS.SEARCH_PROFILES,
      label: 'Search Profiles',
      icon: Search,
      handler: handleSearchProfiles,
    },
    {
      id: PROFILES_LIST_ACTION_IDS.FILTER_PROFILES,
      label: 'Filter Profiles',
      icon: Filter,
      handler: handleFilterProfiles,
    },
    {
      id: PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES,
      label: 'Refresh',
      icon: RefreshCw,
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
