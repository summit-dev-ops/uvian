/**
 * Search Feature Types
 *
 * Generic types for the context-based search system.
 */

import type { ReactNode } from 'react';

export interface SearchContextValue<T> {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;

  results: T[];
  isLoading: boolean;
  error: Error | null;

  page: number;
  totalPages: number;
  hasMore: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;

  selected: T[];
  toggleSelected: (item: T) => void;
  isSelected: (item: T) => boolean;
  clearSelection: () => void;
  setSelected: (items: T[]) => void;
}

export interface SearchProviderProps<T> {
  children: (context: SearchContextValue<T>) => ReactNode;
  initialSelected?: T[];
  onSubmit?: (selected: T[]) => void;
}

export interface SearchInputProps<T> {
  context: SearchContextValue<T>;
  placeholder?: string;
  onRemoveSelected?: (item: T) => void;
}

export interface SearchResultsProps<T> {
  results: T[];
  isLoading: boolean;
  error: Error | null;
  renderItem?: (item: T) => ReactNode;
  emptyMessage?: string;
  selected?: T[];
  onItemClick?: (item: T) => void;
}

export interface SearchInterfaceProps<T> {
  context: SearchContextValue<T>;
  renderResults?: (results: T[]) => ReactNode;
  renderItem?: (item: T) => ReactNode;
  emptyMessage?: string;
  actions?: ReactNode;
}

export interface SearchDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  SearchProvider: React.ComponentType<{
    children: (context: SearchContextValue<T>) => ReactNode;
    initialSelected?: T[];
    onSubmit?: (selected: T[]) => void;
  }>;
  initialSelected?: T[];
  onSubmit: (selected: T[]) => void;
  title?: string;
  submitLabel?: string;
}
