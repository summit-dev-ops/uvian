'use client';

/**
 * User Search Interface Component
 *
 * Integrated search interface combining search field and results.
 * Follows established patterns from the user domain.
 */

import * as React from 'react';
import { ProfileSearchResults as ProfileSearchResultsComponent } from './profile-search-results';
import { useProfileSearch } from '../../hooks/use-profile-search';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import type {
  ProfileSearchParams,
  ProfileUI,
  ProfileSearchResults,
} from '~/lib/domains/profile/types';
import useDebounce from '~/components/shared/hooks/use-debounce';
import { Button } from '@org/ui';

export interface ProfileSearchInterfaceProps {
  // Initial search parameters
  initialParams?: ProfileSearchParams;

  // UI configuration
  showTypeFilter?: boolean;
  showResultsCount?: boolean;
  defaultLimit?: number;

  // Callbacks
  onProfileSelect?: (profile: ProfileUI) => void;
  onSearchStart?: (params: ProfileSearchParams) => void;
  onSearchComplete?: (results: ProfileSearchResults) => void;

  // Styling
  className?: string;
  searchFieldClassName?: string;
  resultsClassName?: string;
}

export function ProfileSearchInterface({
  showTypeFilter = false,
  onProfileSelect,
  className,
  searchFieldClassName,
  resultsClassName,
}: ProfileSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<
    'human' | 'agent' | 'all'
  >('all');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchParams = React.useMemo((): ProfileSearchParams => {
    return {
      query: debouncedSearchQuery,
      type: selectedType === 'all' ? ['agent', 'human'] : [selectedType],
    };
  }, [debouncedSearchQuery, selectedType]);

  const { data, isLoading, error, isSearching } =
    useProfileSearch(searchParams);

  return (
    <div className={`no-scrollbar space-y-6 h-[50vh] ${className || ''}`}>
      <div className={searchFieldClassName}>
        <input
          type="text"
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      {showTypeFilter && (
        <div className="flex gap-2">
          <Button onClick={() => setSelectedType('all')}>All Types</Button>
          <Button onClick={() => setSelectedType('human')}>Humans</Button>
          <Button onClick={() => setSelectedType('agent')}>Agent</Button>
        </div>
      )}
      <div className="no-scrollbar -mx-4 overflow-y-auto px-4">
        {/* Search Status */}
        {isLoading && (
          <InterfaceLoading
            variant="default"
            message={
              searchQuery ? `Searching for "${searchQuery}"...` : 'Loading...'
            }
            size="default"
            className="py-4"
          />
        )}

        {/* Error State */}
        {error && (
          <InterfaceError
            variant="card"
            title="Search Failed"
            message={
              error.message || 'Failed to search profiles. Please try again.'
            }
            showRetry={true}
            showHome={false}
            onRetry={() => window.location.reload()}
            className="py-8"
          />
        )}

        {/* Results */}
        {data && searchQuery && (
          <ProfileSearchResultsComponent
            data={data}
            isLoading={isLoading}
            isLoadingMore={isSearching}
            onProfileSelect={onProfileSelect}
            className={resultsClassName}
          />
        )}
        {/* Results */}
        {data && searchQuery && (
          <ProfileSearchResultsComponent
            data={data}
            isLoading={isLoading}
            isLoadingMore={isSearching}
            onProfileSelect={onProfileSelect}
            className={resultsClassName}
          />
        )}

        {/* Empty State - No Query */}
        {!searchQuery && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Start typing to search for profiles to invite to your spaces and
              conversations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
