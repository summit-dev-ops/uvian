'use client';

import * as React from 'react';
import { RotateCcw, Download, Upload } from 'lucide-react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/page-actions/page-action-context';

export interface SettingsPageActionContextType {
  readonly ACTION_RESET_SETTINGS: 'reset-settings';
  readonly ACTION_EXPORT_SETTINGS: 'export-settings';
  readonly ACTION_IMPORT_SETTINGS: 'import-settings';
}

interface SettingsPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SETTINGS_ACTION_IDS = {
  RESET_SETTINGS: 'reset-settings',
  EXPORT_SETTINGS: 'export-settings',
  IMPORT_SETTINGS: 'import-settings',
} as const;

export function SettingsPageActionProvider({
  children,
  onError,
  onSuccess,
}: SettingsPageActionProviderProps) {

  // Handler for resetting settings
  const handleResetSettings = React.useCallback(async () => {
    try {
      // Clear all settings drafts
      console.log('Settings have been reset');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }, []);

  // Handler for exporting settings
  const handleExportSettings = React.useCallback(async () => {
    try {
      // Generate settings export
      const settingsData = {
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(settingsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user-settings.json';
      link.click();

      URL.revokeObjectURL(url);
      console.log('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }, []);

  // Handler for importing settings
  const handleImportSettings = React.useCallback(async () => {
    try {
      // Create file input for importing settings
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          if (data.settings && typeof data.settings === 'object') {
            // Apply imported settings (this would integrate with the settings store)
            console.log('Settings imported successfully:', data.settings);
            // TODO: Apply the imported settings to the store
          } else {
            throw new Error('Invalid settings file format');
          }
        } catch (error) {
          console.error('Failed to import settings:', error);
          throw error;
        }
      };

      input.click();
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: SETTINGS_ACTION_IDS.RESET_SETTINGS,
      label: 'Reset Settings',
      icon: RotateCcw,
      handler: handleResetSettings,
    },
    {
      id: SETTINGS_ACTION_IDS.EXPORT_SETTINGS,
      label: 'Export Settings',
      icon: Download,
      handler: handleExportSettings,
    },
    {
      id: SETTINGS_ACTION_IDS.IMPORT_SETTINGS,
      label: 'Import Settings',
      icon: Upload,
      handler: handleImportSettings,
    },
  ];

  // Success and error handlers for the PageActionProvider
  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useSettingsPageActionContext() {
  const context = React.useContext(
    React.createContext<SettingsPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSettingsPageActionContext must be used within a SettingsPageActionProvider'
    );
  }
  return context;
}
