'use client';

import * as React from 'react';
import { Edit, Settings, Share, Download } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/page-actions/page-action-context';
const PROFILE_ACTION_IDS = {
  EDIT_PROFILE: 'edit-profile',
  SHOW_SETTINGS: 'show-settings',
  SHARE_PROFILE: 'share-profile',
  EXPORT_DATA: 'export-data',
} as const;

/**
 * Profile page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function ProfilePageActions() {
  const context = usePageActionContext();

  const handleEditProfile = React.useCallback(async () => {
    // Execute the edit profile action
    await context.executeAction(PROFILE_ACTION_IDS.EDIT_PROFILE);
  }, [context]);

  const handleShowSettings = React.useCallback(async () => {
    // Execute the settings action
    await context.executeAction(PROFILE_ACTION_IDS.SHOW_SETTINGS);
  }, [context]);

  const handleShareProfile = React.useCallback(async () => {
    // Execute the share profile action
    await context.executeAction(PROFILE_ACTION_IDS.SHARE_PROFILE);
  }, [context]);

  const handleExportData = React.useCallback(async () => {
    // Execute the export data action
    await context.executeAction(PROFILE_ACTION_IDS.EXPORT_DATA);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleEditProfile}
        className="cursor-pointer"
        disabled={context.isActionExecuting(PROFILE_ACTION_IDS.EDIT_PROFILE)}
      >
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit Profile</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleShowSettings}
        className="cursor-pointer"
        disabled={context.isActionExecuting(PROFILE_ACTION_IDS.SHOW_SETTINGS)}
      >
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleShareProfile}
        className="cursor-pointer"
        disabled={context.isActionExecuting(PROFILE_ACTION_IDS.SHARE_PROFILE)}
      >
        <Share className="mr-2 h-4 w-4" />
        <span>Share Profile</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleExportData}
        className="cursor-pointer"
        disabled={context.isActionExecuting(PROFILE_ACTION_IDS.EXPORT_DATA)}
      >
        <Download className="mr-2 h-4 w-4" />
        <span>Export Data</span>
      </DropdownMenuItem>
    </>
  );
}
