'use client';

import { useQueries } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';

/**
 * Hook to bulk fetch profiles for message senders
 * Optimized for chat contexts where multiple messages from different senders are displayed
 */
export function useMessageProfiles(senderIds: string[]) {
  const uniqueIds = senderIds
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index);

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      ...profileQueries.profile(id),
      enabled: !!id,
    })),
  });
  const profiles = queries
    .filter((q) => q.data)
    .map((q) => q.data as ProfileUI)
    .reduce((acc, profile) => {
      acc[profile.id] = profile;
       console.log(profile)
      return acc;
    }, {} as Record<string, ProfileUI>);

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error);

  return {
    profiles,
    isLoading,
    error,
    queries,
  };
}
