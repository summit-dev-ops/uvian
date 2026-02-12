'use client';

/**
 * User Search Interface Component
 *
 * Integrated search interface combining search field and results.
 * Follows established patterns from the user domain.
 */

import * as React from 'react';
import { UserSearchResults as UserSearchResultsComponent } from './user-search-results';
import { useUserSearch } from '../../hooks/use-user-search';
import type {
  UserSearchParams,
  ProfileUI,
  UserSearchResults,
} from '~/lib/domains/user/types';
import useDebounce from '~/components/shared/hooks/use-debounce';
import { Button, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput
} from '@org/ui';
import { SearchIcon, X } from 'lucide-react';


export interface UserSearchInterfaceProps {
  // Initial search parameters
  initialParams?: UserSearchParams;

  // UI configuration
  showTypeFilter?: boolean;
  showResultsCount?: boolean;
  defaultLimit?: number;

  // Callbacks
  onProfileSelect?: (profile: ProfileUI) => void;
  onSearchStart?: (params: UserSearchParams) => void;
  onSearchComplete?: (results: UserSearchResults) => void;

  // Styling
  className?: string;
  searchFieldClassName?: string;
  resultsClassName?: string;
}

export function UserSearchInterface({
  showTypeFilter = false,
  onProfileSelect,
  className,
  searchFieldClassName,
  resultsClassName,
}: UserSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<
    'human' | 'agent' | 'all'
  >('all');

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const searchParams = React.useMemo((): UserSearchParams => {
    return {
      query: debouncedSearchQuery,
      type: selectedType === 'all' ? ["agent", "human"] : [selectedType]
    }
  }, [debouncedSearchQuery, selectedType])

  const { data, isLoading, error, isSearching } = useUserSearch(searchParams)

  return (
    <div className={`no-scrollbar space-y-6 h-[50vh] ${className || ''}`}>
      <div className={searchFieldClassName}>
        
      </div>
      {showTypeFilter && (
        <div className="flex gap-2">
          <Button
            onClick={() => setSelectedType('all')}
          >
            All Types
          </Button>
          <Button
            onClick={() => setSelectedType('human')}
          >
            Humans
          </Button>
          <Button
            onClick={() => setSelectedType('agent')}>
            Agent
          </Button>
        </div>
      )}
      <div className="no-scrollbar -mx-4 overflow-y-auto px-4">
        {/* Search Status */}
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `Searching for "${searchQuery}"...` : 'Loading...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">
              Failed to search profiles. Please try again.
            </p>
          </div>
        )}

        {/* Results */}
        {data && searchQuery && (
          <UserSearchResultsComponent
            data={data}
            isLoading={isLoading}
            isLoadingMore={isSearching}
            onProfileSelect={onProfileSelect}
            className={resultsClassName}
          />
        )}
        {/* Results */}
        {data && searchQuery && (
          <UserSearchResultsComponent
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
