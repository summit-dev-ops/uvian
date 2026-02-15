import { useQuery } from '@tanstack/react-query';
import { supportQueries } from '~/lib/domains/support/api/queries';
import type { SupportSearchParams } from '~/lib/domains/support/types';

export function useSupportSearch(params: Partial<SupportSearchParams> = {}) {
  const query = useQuery({
    ...supportQueries.searchFAQ(params as SupportSearchParams),
    enabled: Boolean(params.query?.trim()),
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    canLoadMore: query.data?.hasMore ?? false,
    isSearching: query.isFetching && !query.isLoading,
  };
}
