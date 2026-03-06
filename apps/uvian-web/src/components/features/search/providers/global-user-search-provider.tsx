'use client';

import React, { useMemo, useState, useDeferredValue, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import {
  SearchContext,
  SearchContextValue,
} from '~/components/shared/ui/search/contexts';
import { SearchResultItemData } from '~/components/shared/ui/search/types';
import type { UserSearchParams } from '~/lib/domains/profile/types';

interface GlobalUserSearchProviderProps {
  children: React.ReactNode;
  searchContext?: UserSearchParams['searchContext'];
}

export function GlobalUserSearchProvider({
  children,
  searchContext,
}: GlobalUserSearchProviderProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const debouncedQuery = useDeferredValue(query);

  const { data, isLoading, error } = useQuery({
    ...profileQueries.searchUsers({
      query: debouncedQuery,
      page,
      limit: 10,
      searchContext,
    }),
    enabled: debouncedQuery.length > 0,
  });

  const results = useMemo<SearchResultItemData[]>(() => {
    if (!data?.users) return [];
    return data.users.map<SearchResultItemData>((user) => ({
      url: '',
      key: user.userId,
      type: 'user',
      content: {
        avatarUrl: user.avatarUrl,
        displayName: user.displayName,
        userType: user.type,
        profileId: user.profileId,
      },
    }));
  }, [data]);

  const search = useCallback(
    async (q: string): Promise<SearchResultItemData[]> => {
      if (!q.trim()) return [];

      const data = await queryClient.fetchQuery(
        profileQueries.searchUsers({
          query: q,
          page: 1,
          limit: 10,
          searchContext,
        })
      );

      return data.users.map((user) => ({
        url: '',
        key: user.userId,
        type: 'user',
        content: {
          avatarUrl: user.avatarUrl,
          displayName: user.displayName,
          userType: user.type,
          profileId: user.profileId,
        },
      }));
    },
    [queryClient, searchContext]
  );

  const contextValue = useMemo<SearchContextValue>(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      results,
      isLoading,
      error: error as Error | null,
      page,
      totalPages: data?.pagination?.total
        ? Math.ceil(data.pagination.total / 10)
        : 1,
      hasMore: data?.pagination?.hasMore ?? false,
      goToPage: (p) => setPage(Math.max(1, p)),
      nextPage: () => setPage((p) => p + 1),
      prevPage: () => setPage((p) => Math.max(1, p - 1)),
      setPage: (p) => setPage(p),
      search,
    }),
    [query, debouncedQuery, results, isLoading, error, page, data, search]
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}
