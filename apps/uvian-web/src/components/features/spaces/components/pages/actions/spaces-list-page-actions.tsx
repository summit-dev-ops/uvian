'use client';

import * as React from 'react';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/page-actions/page-action-context';
const SPACES_ACTION_IDS = {
  CREATE_SPACE: 'create-space',
  REFRESH_SPACES: 'refresh-spaces',
  SHOW_SETTINGS: 'show-settings',
} as const;

/**
 * Spaces list page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SpacesListPageActions() {
  const context = usePageActionContext();

  const handleCreateSpace = React.useCallback(() => {
    // Open the create space modal directly
    // The provider has already configured the modal with onCreate and other props
    context.openModal(SPACES_ACTION_IDS.CREATE_SPACE);
  }, [context]);

  const handleRefresh = React.useCallback(async () => {
    // Execute the refresh action
    await context.executeAction(SPACES_ACTION_IDS.REFRESH_SPACES);
  }, [context]);

  const handleShowSettings = React.useCallback(async () => {
    // Execute the settings action
    await context.executeAction(SPACES_ACTION_IDS.SHOW_SETTINGS);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleCreateSpace}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACES_ACTION_IDS.CREATE_SPACE)}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(SPACES_ACTION_IDS.CREATE_SPACE)
            ? 'Creating...'
            : 'Create Space'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleRefresh}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACES_ACTION_IDS.REFRESH_SPACES)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleShowSettings}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SPACES_ACTION_IDS.SHOW_SETTINGS)}
      >
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
    </>
  );
}
