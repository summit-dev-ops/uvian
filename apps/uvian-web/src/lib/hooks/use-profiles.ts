'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileUI } from '~/lib/domains/profile/types';

export function useProfiles(ids: string[]) {
  const uniqueIds = ids
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
    .reduce((acc, q, index) => {
      if (q.data) {
        const key = uniqueIds[index];
        acc[key] = q.data;
      }
      return acc;
    }, {} as Record<string, ProfileUI>);

  const isLoading = queries.some((q) => q.isLoading);
  const isPending = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.error);

  return {
    profiles,
    isLoading,
    isPending,
    error: error?.error,
  };
}

export function useProfile(userId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    ...profileQueries.profile(userId),
    enabled: !!userId,
  });

  return {
    profile: data,
    isLoading,
    error,
  };
}
