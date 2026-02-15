'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { profileQueries } from '~/lib/domains/profile/api/queries';

/**
 * useOnboardingEligibility - Eligibility detection hook
 *
 * Determines if the current user needs to complete onboarding
 * by checking if they have existing profiles.
 *
 * Dependencies: None (uses global profile queries)
 *
 * @returns Eligibility information including needsOnboarding flag
 */
export function useOnboardingEligibility() {
  const queryClient = useQueryClient();

  // Check if we have cached profile data first
  const cachedData = React.useMemo(() => {
    const queryData = queryClient.getQueryData(
      profileQueries.userProfiles().queryKey
    );
    return Array.isArray(queryData) ? queryData : [];
  }, [queryClient]);

  // If we have cached data, use it directly
  // Otherwise, mark as loading
  const userProfiles = cachedData;
  const isLoading = !cachedData.length;
  const profileCount = userProfiles.length;
  const hasProfiles = profileCount > 0;

  // User needs onboarding if they have no profiles
  // or if profiles are still loading (conservative approach)
  const needsOnboarding = !hasProfiles || isLoading;

  // Ensure query data is fetched
  React.useEffect(() => {
    queryClient.ensureQueryData(profileQueries.userProfiles());
  }, [queryClient]);

  // Manual refetch function
  const refetch = React.useCallback(async () => {
    return queryClient.refetchQueries(profileQueries.userProfiles());
  }, [queryClient]);

  return {
    // Core eligibility
    needsOnboarding,
    isLoading,

    // Profile information
    hasProfiles,
    profileCount,
    userProfiles,

    // Actions
    refetch,
  };
}
