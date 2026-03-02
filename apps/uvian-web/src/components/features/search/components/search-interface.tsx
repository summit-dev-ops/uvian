'use client';

import React from 'react';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';
import type { SearchInterfaceProps } from '../contexts/types';

export function SearchInterface<T>({
  context,
  renderResults,
  renderItem,
  emptyMessage = 'No results found',
  actions,
}: SearchInterfaceProps<T>) {
  const { query, results, isLoading, error, selected, toggleSelected } =
    context;

  const handleItemClick = (item: T) => {
    toggleSelected(item);
  };

  return (
    <div className="space-y-4">
      <SearchInput context={context} placeholder="Search..." />

      <div className="max-h-[300px] overflow-y-auto">
        {renderResults ? (
          renderResults(results)
        ) : (
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            renderItem={renderItem}
            emptyMessage={query ? emptyMessage : 'Start typing to search'}
            selected={selected}
            onItemClick={handleItemClick}
          />
        )}
      </div>

      {actions && <div className="flex justify-end gap-2 pt-2">{actions}</div>}
    </div>
  );
}
