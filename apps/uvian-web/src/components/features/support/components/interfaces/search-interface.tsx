'use client';

/**
 * Search Interface Component
 *
 * Dedicated search interface for finding support content with
 * advanced filtering and search history features.
 */

import * as React from 'react';
import { Search, History, TrendingUp, X } from 'lucide-react';
import { Button } from '@org/ui';
import { Input } from '@org/ui';
import { Card, CardContent } from '@org/ui';
import { ScrollArea } from '@org/ui';
import { Badge } from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';
import type { SupportUI } from '~/lib/domains/support/types';

export interface SearchInterfaceProps {
  // Configuration
  showSearchHistory?: boolean;
  showPopular?: boolean;
  initialQuery?: string;

  // Callbacks
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SupportUI) => void;
  onClearHistory?: () => void;
  onSaveSearch?: (query: string) => void;

  // Styling
  className?: string;
}

export function SearchInterface({
  showSearchHistory = true,
  showPopular = true,
  initialQuery = '',
  onSearch,
  onResultSelect,
  onClearHistory,
  onSaveSearch,
  className,
}: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('relevance');

  // Mock search history
  const searchHistory = [
    { query: 'profile settings', timestamp: Date.now() - 1000 * 60 * 30 },
    {
      query: 'how to create space',
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
    },
    { query: 'job posting', timestamp: Date.now() - 1000 * 60 * 60 * 24 },
    { query: 'invite members', timestamp: Date.now() - 1000 * 60 * 60 * 48 },
  ];

  // Mock popular searches
  const popularSearches = [
    { query: 'getting started', count: 145 },
    { query: 'profile', count: 98 },
    { query: 'spaces', count: 76 },
    { query: 'jobs', count: 54 },
    { query: 'settings', count: 43 },
  ];

  // Mock search results
  const searchResults: SupportUI[] = [
    {
      id: '1',
      question: 'How do I update my profile information?',
      answer:
        'Go to Settings > Profile to update your personal information, skills, experience, and other profile details. Changes are saved automatically.',
      category: 'Account',
      tags: ['profile', 'settings', 'account'],
      helpful: 56,
      views: 234,
    },
    {
      id: '2',
      question: 'How do I change my profile picture?',
      answer:
        'You can change your profile picture by going to your profile settings. Click on your current avatar and select "Upload New Photo" from the menu.',
      category: 'Account',
      tags: ['profile', 'avatar', 'photo'],
      helpful: 34,
      views: 178,
    },
    {
      id: '3',
      question: 'How do I delete my account?',
      answer:
        'You can delete your account from Settings > Account > Delete Account. Please note that this action is irreversible and will permanently remove all your data from Uvian.',
      category: 'Account',
      tags: ['account', 'delete', 'privacy'],
      helpful: 23,
      views: 78,
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
    if (query.trim()) {
      onSaveSearch?.(query.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearHistoryItem = (timestamp: number) => {
    // Implementation for clearing individual history item
    console.log('Clear history item:', timestamp);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'account', label: 'Account & Profile' },
    { value: 'spaces', label: 'Spaces & Collaboration' },
    { value: 'chats', label: 'Chats & Messaging' },
    { value: 'jobs', label: 'Jobs & Opportunities' },
    { value: 'features', label: 'Features & Tips' },
    { value: 'troubleshooting', label: 'Troubleshooting' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'helpful', label: 'Most Helpful' },
    { value: 'views', label: 'Most Viewed' },
  ];

  return (
    <ScrollArea className="flex-1">
      <div className={`space-y-6 p-6 ${className || ''}`}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Search Support</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers quickly with our intelligent search. Try specific
            keywords or browse popular topics.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for help articles, guides, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-lg"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Filters */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Search Results for "{searchQuery}"
              </h2>
              <Badge variant="secondary">{searchResults.length} results</Badge>
            </div>

            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card
                  key={result.id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold leading-tight">
                          {result.question}
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                          {result.answer}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{result.helpful || 0} helpful</span>
                          <span>{result.views || 0} views</span>
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                        </div>

                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResultSelect?.(result)}
                        className="ml-4"
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Search History */}
        {!searchQuery && showSearchHistory && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Searches
              </h2>
              {searchHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearHistory}>
                  Clear History
                </Button>
              )}
            </div>

            {searchHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchHistory.map((item) => (
                  <Card
                    key={item.timestamp}
                    className="hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span
                            className="font-medium"
                            onClick={() => handleSearch(item.query)}
                          >
                            {item.query}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearHistoryItem(item.timestamp)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Your search history will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Popular Searches */}
        {!searchQuery && showPopular && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Popular Searches
            </h2>

            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search) => (
                <Button
                  key={search.query}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(search.query)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-3 w-3" />
                  {search.query}
                  <Badge variant="secondary" className="text-xs">
                    {search.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <section className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start your search</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Type keywords above to search our help articles, guides, and FAQs.
            </p>
          </section>
        )}
      </div>
    </ScrollArea>
  );
}
