'use client';

/**
 * User Search Results Interface Component
 *
 * Displays search results with loading states and pagination.
 * Follows established patterns from the user domain.
 */

import * as React from 'react';
import { ChevronDown, Loader2, User, Bot } from 'lucide-react';

import { Button } from '@org/ui';
import { Badge } from '@org/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@org/ui';
import type { UserSearchResults, ProfileUI } from '~/lib/domains/user/types';

export interface UserSearchResultsProps {
  // Search results data
  data: UserSearchResults;

  // Loading states
  isLoading?: boolean;
  isLoadingMore?: boolean;

  // Pagination
  canLoadMore?: boolean;
  onLoadMore?: () => void;

  // Optional profile selection callback
  onProfileSelect?: (profile: ProfileUI) => void;

  // Optional custom profile item renderer
  renderProfileItem?: (profile: ProfileUI) => React.ReactNode;

  // UI configuration
  showTypeFilter?: boolean;
  className?: string;
}

export function UserSearchResults({
  data,
  isLoading = false,
  isLoadingMore = false,
  canLoadMore = false,
  onLoadMore,
  onProfileSelect,
  renderProfileItem = defaultProfileItem,
  className,
}: UserSearchResultsProps) {
  if (isLoading) {
    return <UserSearchResultsSkeleton />;
  }

  if (!data.profiles.length) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No profiles found. Try adjusting your search terms.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {data.pagination.total} profiles found
          {data.filters.query && ` for "${data.filters.query}"`}
        </p>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {data.profiles.map((profile) => (
          <div
            key={profile.profileId}
            className="cursor-pointer"
            onClick={() => onProfileSelect?.(profile)}
          >
            {renderProfileItem(profile)}
          </div>
        ))}
      </div>

      {/* Load more button */}
      {canLoadMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            Load More Profiles
          </Button>
        </div>
      )}
    </div>
  );
}

// Default profile item rendering
function defaultProfileItem(profile: ProfileUI) {
  const typeIcon = profile.type === 'agent' ? Bot : User;
  const TypeIcon = typeIcon;

  const typeColor =
    profile.type === 'agent'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-green-100 text-green-800 border-green-200';

  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={profile.avatarUrl || ''} alt={profile.displayName} />
        <AvatarFallback>
          {profile.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-medium text-sm leading-none truncate">
            {profile.displayName}
          </h3>
          <div className="flex items-center space-x-1">
            <TypeIcon className="h-3 w-3" />
            <Badge variant="outline" className={`text-xs ${typeColor}`}>
              {profile.type}
            </Badge>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground truncate">
            {profile.bio}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          Joined {profile.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Loading skeleton component
function UserSearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-4 border rounded-lg animate-pulse"
        >
          <div className="h-12 w-12 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
