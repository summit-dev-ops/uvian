'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { SearchResultItemData } from '../types';
import { SearchResultItem } from './search-result-item';

interface SearchResultsProps {
  results: SearchResultItemData[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage?: string;
}

export function SearchResults({
  results,
  isLoading,
  error,
  emptyMessage = 'No results found',
}: SearchResultsProps) {
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
        return (
          <SearchResultItem 
            key={item.key}
            data={item}
          />
        );
      })}
    </div>
  );
}
