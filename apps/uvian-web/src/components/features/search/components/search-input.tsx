'use client';

import React from 'react';
import { Input } from '@org/ui';
import { X } from 'lucide-react';
import type { SearchInputProps } from '../contexts/types';

export function SearchInput<T>({
  context,
  placeholder = 'Search...',
}: SearchInputProps<T>) {
  const { query, setQuery, selected, toggleSelected, clearSelection } = context;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span>{String(item)}</span>
              <button
                type="button"
                onClick={() => toggleSelected(item)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clearSelection}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
