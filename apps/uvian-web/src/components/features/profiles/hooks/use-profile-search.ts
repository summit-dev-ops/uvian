import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileSearchParams } from '~/lib/domains/profile/types';

export function useProfileSearch(params: ProfileSearchParams = {}) {
  const query = useQuery({
    ...profileQueries.searchProfiles(params),
    enabled: Boolean(params.query?.trim()),
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    canLoadMore: query.data?.pagination.hasMore ?? false,
    isSearching: query.isFetching && !query.isLoading,
  };
}
