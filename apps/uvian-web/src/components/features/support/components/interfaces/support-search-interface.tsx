'use client';

/**
 * Support Search Interface Component
 *
 * Simplified search interface using InterfaceLayout patterns with
 * search field, category filtering, and results display for FAQ content.
 */

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { SupportSearchResults } from '../support-search-results';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import {
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
  InterfaceLayout,
} from '~/components/shared/ui/interfaces';
import type {
  SupportUI,
  SupportSearchParams,
  SupportSearchResults as SupportSearchResultsType,
} from '~/lib/domains/support/types';
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@org/ui';
import { Input } from '@org/ui';
import { useSupportSearch, useSupportCategories } from '../../hooks/index';

export interface SupportSearchInterfaceProps {
  // Initial search parameters
  initialParams?: Partial<SupportSearchParams>;

  // UI configuration
  showCategoryFilter?: boolean;
  showResultsCount?: boolean;
  defaultLimit?: number;
  showEmptyState?: boolean;

  // Callbacks
  onResultSelect?: (result: SupportUI) => void;
  onSearchStart?: (params: SupportSearchParams) => void;
  onSearchComplete?: (results: SupportSearchResultsType) => void;

  // Styling
  className?: string;
  searchFieldClassName?: string;
  resultsClassName?: string;
}

export function SupportSearchInterface({
  showCategoryFilter = true,
  showResultsCount = true,
  showEmptyState = true,
  onResultSelect,
  onSearchStart,
  onSearchComplete,
  className,
  searchFieldClassName,
  resultsClassName,
}: SupportSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Fetch categories for filter dropdown
  const { data: categories } = useSupportCategories();

  // Search query is debounced through the useSupportSearch hook
  // The search happens automatically when searchQuery changes

  const searchParams = React.useMemo((): SupportSearchParams => {
    return {
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      limit: 10,
    };
  }, [searchQuery, selectedCategory]);

  const { data, isLoading, error, isSearching } =
    useSupportSearch(searchParams);

  // Notify parent when search starts/completes
  React.useEffect(() => {
    if (searchQuery.trim()) {
      onSearchStart?.(searchParams);
    }
  }, [searchParams, onSearchStart]);

  React.useEffect(() => {
    if (data) {
      onSearchComplete?.(data);
    }
  }, [data, onSearchComplete]);

  const handleResultSelect = (result: SupportUI) => {
    onResultSelect?.(result);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <InterfaceLayout>
      <InterfaceContainer className={className}>
        <InterfaceHeader
          sticky={'always'}
          className="flex flex-col gap-2" 
        >
          {(!data || isLoading) && (
            <InterfaceHeaderContent
              title="Support Search"
              subtitle="Search for topics"
            />
          )}
          <InputGroup>
            <InputGroupAddon align={'inline-start'}>
              <Search className=" text-muted-foreground h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Search support topics, questions, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon align={'inline-end'}>
              {searchQuery && (
                <InputGroupButton
                  variant={'ghost'}
                  size={'icon-sm'}
                  onClick={handleClearSearch}
                >
                  <X />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>

          {/* Category Filter */}
          {showCategoryFilter && categories && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Topics
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.name ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </InterfaceHeader>

        <InterfaceContent>
          <InterfaceSection>
            <div className="space-y-6">
              {/* Search Status */}
              {isLoading && (
                <InterfaceLoading
                  variant="default"
                  message={
                    searchQuery
                      ? `Searching for "${searchQuery}"...`
                      : 'Loading support content...'
                  }
                  size="default"
                  className="py-8"
                />
              )}

              {/* Error State */}
              {error && (
                <InterfaceError
                  variant="card"
                  title="Search Failed"
                  message={
                    error.message ||
                    'Failed to search support content. Please try again.'
                  }
                  showRetry={true}
                  showHome={false}
                  onRetry={() => window.location.reload()}
                  className="py-8"
                />
              )}

              {/* Results */}
              {data && searchQuery && (
                <div className={resultsClassName}>
                  <SupportSearchResults
                    data={data}
                    isLoading={isLoading}
                    isLoadingMore={isSearching}
                    onResultSelect={handleResultSelect}
                  />
                </div>
              )}

              {/* Empty State - No Query */}
              {!searchQuery && !isLoading && showEmptyState && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Search Support Content
                    </h3>
                    <p className="text-muted-foreground">
                      Find answers to common questions about Uvian features,
                      account management, and troubleshooting. Use keywords or
                      browse by category.
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State - No Results */}
              {data && searchQuery && data.totalCount === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any support articles matching your
                      search. Try different keywords or browse our categories.
                    </p>
                    <Button variant="outline" onClick={handleClearSearch}>
                      Clear Search
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
