'use client';

import React, { ReactNode } from 'react';
import { SearchResults } from './search-results';
import { useSearchContext } from '../contexts/search-context';
import { SearchBar } from './search-bar';

interface SearchInterfaceProps {
  emptyMessage?: string;
  children?: ReactNode;
}

export function SearchInterface({
  emptyMessage = 'No results found',
  children,
}: SearchInterfaceProps) {
  const { results, isLoading, error, query, setQuery } = useSearchContext();

  return (
    <div className="space-y-4">
      <SearchBar query={query} onChange={setQuery} />
      {children}
      <div className="max-h-[300px] overflow-y-auto">
        <SearchResults
          results={results}
          isLoading={isLoading}
          error={error}
          emptyMessage={query ? emptyMessage : 'Start typing to search'}
        />
      </div>
    </div>
  );
}
