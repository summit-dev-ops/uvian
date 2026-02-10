'use client';

import React from 'react';
import { SettingsForm } from './forms/settings-form';
import { useProfile } from '../hooks/use-profile';

// Optimized prop interface
interface SettingsEditorProps {
  onSave?: () => void;
  onCancel?: () => void;
  hasUnsavedChanges?: boolean;
  className?: string;
}

/**
 * SettingsEditor - Data-aware wrapper that handles business logic and uses SettingsForm
 * Manages settings data transformation and mutation logic
 */
export const SettingsEditor: React.FC<SettingsEditorProps> = ({
  onSave,
  onCancel,
  hasUnsavedChanges = false,
  className,
}) => {
  const { settings, handleUpdateSettings, isUpdatingSettings } = useProfile();

  // Transform settings data to match SettingsForm interface
  const formInitialData = {
    account: {
      emailNotifications:
        settings?.settings?.account?.emailNotifications ?? true,
      emailFrequency:
        settings?.settings?.account?.emailFrequency ?? 'immediate',
    },
    notifications: {
      pushNotifications:
        settings?.settings?.notifications?.pushNotifications ?? true,
      soundEnabled: settings?.settings?.notifications?.soundEnabled ?? false,
      mentionNotifications:
        settings?.settings?.notifications?.mentionNotifications ?? true,
      messageNotifications:
        settings?.settings?.notifications?.messageNotifications ?? true,
    },
    privacy: {
      profileVisibility:
        settings?.settings?.privacy?.profileVisibility ?? 'public',
      allowDirectMessages:
        settings?.settings?.privacy?.allowDirectMessages ?? true,
      readReceipts: settings?.settings?.privacy?.readReceipts ?? true,
    },
    appearance: {
      theme: settings?.settings?.appearance?.theme ?? 'auto',
      compactMode: settings?.settings?.appearance?.compactMode ?? false,
      showAvatars: settings?.settings?.appearance?.showAvatars ?? true,
    },
  };

  const handleSubmit = async (formData: {
    account: {
      emailNotifications: boolean;
      emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
    };
    notifications: {
      pushNotifications: boolean;
      soundEnabled: boolean;
      mentionNotifications: boolean;
      messageNotifications: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'contacts';
      allowDirectMessages: boolean;
      readReceipts: boolean;
    };
    appearance: {
      theme: 'light' | 'dark' | 'auto';
      compactMode: boolean;
      showAvatars: boolean;
    };
  }) => {
    try {
      // Transform nested data to flat format expected by backend
      const flattenedSettings = {
        ...formData.account,
        ...formData.notifications,
        ...formData.privacy,
        ...formData.appearance,
      };

      await handleUpdateSettings(flattenedSettings);
      onSave?.();
    } catch (error) {
      console.error('Settings update failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className={`flex flex-1 flex-col ${className || ''}`}>
      <SettingsForm
        initialData={formInitialData}
        onSubmit={handleSubmit}
        onCancel={onCancel ? handleCancel : undefined}
        isLoading={isUpdatingSettings}
        showCancel={false} // Editor handles its own cancel logic if needed
      />
    </div>
  );
};
