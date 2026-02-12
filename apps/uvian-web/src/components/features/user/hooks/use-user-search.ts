import { useQuery } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api/queries';
import type { UserSearchParams } from '~/lib/domains/user/types';

export function useUserSearch(params: UserSearchParams = {}) {
  const query = useQuery({
    ...userQueries.searchProfiles(params),
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
