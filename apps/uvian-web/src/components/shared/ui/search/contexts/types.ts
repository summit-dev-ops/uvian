/**
 * Search Feature Types
 *
 * Generic types for the context-based search system.
 */
import { SearchResultItemData } from '../types';

export interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;

  results: SearchResultItemData[];
  isLoading: boolean;
  error: Error | null;

  page: number;
  totalPages: number;
  hasMore: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;

  search?: (query: string) => Promise<SearchResultItemData[]>;
}

export type SelectionMode = 'multiple-choice' | 'single-choice' | 'none';

export interface SelectionContextValue<T> {
  selected: T[];
  toggleSelected: (item: T) => void;
  isSelected: (item: T) => boolean;
  clearSelection: () => void;
  mode: SelectionMode;
}
