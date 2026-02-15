'use client';

import * as React from 'react';
import { Plus, RefreshCw, Search, Filter } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';

const PROFILES_LIST_ACTION_IDS = {
  CREATE_PROFILE: 'create-profile',
  REFRESH_PROFILES: 'refresh-profiles',
  SEARCH_PROFILES: 'search-profiles',
  FILTER_PROFILES: 'filter-profiles',
} as const;

/**
 * Profiles list page-specific actions component
 */
export function ProfilesListPageActions() {
  const context = usePageActionContext();

  const handleCreateProfile = React.useCallback(() => {
    context.openModal(PROFILES_LIST_ACTION_IDS.CREATE_PROFILE);
  }, [context]);

  const handleRefresh = React.useCallback(async () => {
    await context.executeAction(PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES);
  }, [context]);

  const handleSearch = React.useCallback(() => {
    context.openModal(PROFILES_LIST_ACTION_IDS.SEARCH_PROFILES);
  }, [context]);

  const handleFilter = React.useCallback(() => {
    context.openModal(PROFILES_LIST_ACTION_IDS.FILTER_PROFILES);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCreateProfile}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.CREATE_PROFILE
        )}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(PROFILES_LIST_ACTION_IDS.CREATE_PROFILE)
            ? 'Creating...'
            : 'Create Profile'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleSearch}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.SEARCH_PROFILES
        )}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleFilter}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.FILTER_PROFILES
        )}
      >
        <Filter className="mr-2 h-4 w-4" />
        <span>Filter</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          PROFILES_LIST_ACTION_IDS.REFRESH_PROFILES
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>
    </>
  );
}
