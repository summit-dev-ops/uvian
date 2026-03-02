'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { SearchResultsProps } from '../contexts/types';

export function SearchResults<T>({
  results,
  isLoading,
  error,
  renderItem,
  emptyMessage = 'No results found',
  selected = [],
  onItemClick,
}: SearchResultsProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((item, index) => {
        const isItemSelected = selected.some(
          (s) => JSON.stringify(s) === JSON.stringify(item)
        );

        return (
          <div
            key={index}
            onClick={() => onItemClick?.(item)}
            className={`
              cursor-pointer p-2 rounded-lg border transition-colors
              ${
                isItemSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-muted'
              }
            `}
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <div className="flex items-center gap-2">
                <span>{String(item)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
