'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useDeferredValue,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { UserSearchResult } from '~/lib/domains/profile/types';

interface GlobalUserSearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  results: UserSearchResult[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  selected: UserSearchResult[];
  toggleSelected: (item: UserSearchResult) => void;
  isSelected: (item: UserSearchResult) => boolean;
  clearSelection: () => void;
  setSelected: (items: UserSearchResult[]) => void;
}

const GlobalUserSearchContext =
  createContext<GlobalUserSearchContextValue | null>(null);

export function useGlobalUserSearch() {
  const context = useContext(GlobalUserSearchContext);
  if (!context) {
    throw new Error(
      'useGlobalUserSearch must be used within GlobalUserSearchProvider'
    );
  }
  return context;
}

interface GlobalUserSearchProviderProps {
  children: React.ReactNode;
  initialSelected?: UserSearchResult[];
}

export function GlobalUserSearchProvider({
  children,
  initialSelected = [],
}: GlobalUserSearchProviderProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserSearchResult[]>(initialSelected);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDeferredValue(query);

  const { data, isLoading, error } = useQuery({
    ...profileQueries.searchUsers({ query: debouncedQuery, page, limit: 10 }),
    enabled: debouncedQuery.length > 0,
  });

  const results = useMemo(() => {
    if (!data?.users) return [];
    return data.users;
  }, [data]);

  const toggleSelected = useCallback((item: UserSearchResult) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.profileId === item.profileId);
      if (exists) {
        return prev.filter((s) => s.profileId !== item.profileId);
      }
      return [...prev, item];
    });
  }, []);

  const isSelected = useCallback(
    (item: UserSearchResult) => {
      return selected.some((s) => s.profileId === item.profileId);
    },
    [selected]
  );

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  const contextValue = useMemo<GlobalUserSearchContextValue>(
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
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
      setSelected,
    }),
    [
      query,
      debouncedQuery,
      results,
      isLoading,
      error,
      page,
      data,
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
    ]
  );

  return (
    <GlobalUserSearchContext.Provider value={contextValue}>
      {children}
    </GlobalUserSearchContext.Provider>
  );
}
