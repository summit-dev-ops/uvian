'use client';

import { createContext, useContext } from 'react';
import type { SearchContextValue } from './types';

export const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearchContext(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context as SearchContextValue;
}
