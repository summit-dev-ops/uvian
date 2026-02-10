'use client';

import * as React from 'react';
import { RotateCcw, Download, Upload } from 'lucide-react';
import { DropdownMenuItem } from '@org/ui';
import { usePageActionContext } from '~/components/shared/page-actions/page-action-context';

const SETTINGS_ACTION_IDS = {
  RESET_SETTINGS: 'reset-settings',
  EXPORT_SETTINGS: 'export-settings',
  IMPORT_SETTINGS: 'import-settings',
} as const;

/**
 * Settings page-specific actions component
 * Uses PageActionContext for modal management and action execution
 */
export function SettingsPageActions() {
  const context = usePageActionContext();

  const handleResetSettings = React.useCallback(async () => {
    await context.executeAction(SETTINGS_ACTION_IDS.RESET_SETTINGS);
  }, [context]);

  const handleExportSettings = React.useCallback(async () => {
    await context.executeAction(SETTINGS_ACTION_IDS.EXPORT_SETTINGS);
  }, [context]);

  const handleImportSettings = React.useCallback(async () => {
    await context.executeAction(SETTINGS_ACTION_IDS.IMPORT_SETTINGS);
  }, [context]);

  return (
    <>
      <DropdownMenuItem
        onClick={handleResetSettings}
        className="cursor-pointer"
        disabled={context.isActionExecuting(SETTINGS_ACTION_IDS.RESET_SETTINGS)}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        <span>
          {context.isActionExecuting(SETTINGS_ACTION_IDS.RESET_SETTINGS)
            ? 'Resetting...'
            : 'Reset Settings'}
        </span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleExportSettings}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          SETTINGS_ACTION_IDS.EXPORT_SETTINGS
        )}
      >
        <Download className="mr-2 h-4 w-4" />
        <span>Export Settings</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleImportSettings}
        className="cursor-pointer"
        disabled={context.isActionExecuting(
          SETTINGS_ACTION_IDS.IMPORT_SETTINGS
        )}
      >
        <Upload className="mr-2 h-4 w-4" />
        <span>Import Settings</span>
      </DropdownMenuItem>
    </>
  );
}
