'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api/queries';
import { profileKeys } from '~/lib/domains/profile/api/keys';
import type { ProfileUI } from '~/lib/domains/profile/types';

export function useProfilesByUserId(userIds: string[]) {
  const queryClient = useQueryClient();

  const uniqueIds = userIds
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index);

  const queries = useQueries({
    queries: uniqueIds.map((userId) => ({
      ...userQueries.profileByUserId(userId),
      enabled: !!userId,
    })),
  });

  queries.forEach((query) => {
    if (query.data && !query.isLoading) {
      queryClient.setQueryData(profileKeys.profile(query.data.id), query.data);
    }
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
