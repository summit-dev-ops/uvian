'use client';

/**
 * Support Search Results Component
 *
 * Displays search results for support content, following established patterns
 * from the profile search results component.
 */

import * as React from 'react';
import { Button } from '@org/ui';
import { HelpCircle, ThumbsUp, Eye } from 'lucide-react';
import type {
  SupportUI,
  SupportSearchResults,
} from '~/lib/domains/support/types';

export interface SupportSearchResultsProps {
  data: SupportSearchResults;
  isLoading: boolean;
  isLoadingMore?: boolean;
  onResultSelect?: (result: SupportUI) => void;
  className?: string;
}

export function SupportSearchResults({
  data,
  isLoading,
  isLoadingMore = false,
  onResultSelect,
  className,
}: SupportSearchResultsProps) {
  const handleResultSelect = (result: SupportUI) => {
    onResultSelect?.(result);
  };

  if (!data.items || data.items.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {data.items.map((item) => (
        <SupportResultItem
          key={item.id}
          item={item}
          onSelect={() => handleResultSelect(item)}
        />
      ))}

      {/* Load More Indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Loading more results...
          </p>
        </div>
      )}
    </div>
  );
}

interface SupportResultItemProps {
  item: SupportUI;
  onSelect: () => void;
}

function SupportResultItem({ item, onSelect }: SupportResultItemProps) {
  return (
    <div className="border rounded-lg p-6 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header with Category and Relevance Score */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded">
              {item.category}
            </span>
            {item.relevanceScore && (
              <span className="text-xs text-muted-foreground">
                Relevance: {item.relevanceScore}
              </span>
            )}
          </div>

          {/* Question */}
          <h3 className="text-lg font-semibold leading-tight">
            {item.question}
          </h3>

          {/* Answer Preview */}
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
            {item.answer}
          </p>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{item.helpful || 0} helpful</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{item.views || 0} views</span>
            </div>
            {item.relevanceScore && (
              <div className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Match score: {item.relevanceScore}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            className="whitespace-nowrap"
          >
            Read More
          </Button>
        </div>
      </div>
    </div>
  );
}
