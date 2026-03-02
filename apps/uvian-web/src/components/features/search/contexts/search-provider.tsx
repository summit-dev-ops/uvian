'use client';

import React, {
  createContext,
  useContext,
  useState,
  useDeferredValue,
  useMemo,
  useCallback,
} from 'react';
import type { SearchContextValue, SearchProviderProps } from './types';

const SearchContext = createContext<SearchContextValue<any> | null>(null);

export function useSearchContext<T>(): SearchContextValue<T> {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context as SearchContextValue<T>;
}

export function SearchProvider<T>({
  children,
  initialSelected = [],
  onSubmit,
}: SearchProviderProps<T>) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<T[]>(initialSelected);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDeferredValue(query);

  const toggleSelected = useCallback((item: T) => {
    setSelected((prev) => {
      const isSelected = prev.some(
        (s) => JSON.stringify(s) === JSON.stringify(item)
      );
      if (isSelected) {
        return prev.filter((s) => JSON.stringify(s) !== JSON.stringify(item));
      }
      return [...prev, item];
    });
  }, []);

  const isSelected = useCallback(
    (item: T) => {
      return selected.some((s) => JSON.stringify(s) === JSON.stringify(item));
    },
    [selected]
  );

  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage >= 1) {
      setPage(targetPage);
    }
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const contextValue = useMemo<SearchContextValue<T>>(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      results: [],
      isLoading: false,
      error: null,
      page,
      totalPages: 1,
      hasMore: false,
      goToPage,
      nextPage,
      prevPage,
      setPage: goToPage,
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
      setSelected,
    }),
    [
      query,
      debouncedQuery,
      page,
      selected,
      toggleSelected,
      isSelected,
      clearSelection,
      goToPage,
      nextPage,
      prevPage,
    ]
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children(contextValue)}
    </SearchContext.Provider>
  );
}
