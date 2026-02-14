'use client';

import * as React from 'react';
import { Edit, Settings, Share, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActionRegistrationType, PageActionProvider } from '~/components/shared/page-actions/page-action-context';


export interface ProfilePageActionContextType {
  // Pre-defined action IDs for type safety
  readonly ACTION_EDIT_PROFILE: 'edit-profile';
  readonly ACTION_SHOW_SETTINGS: 'show-settings';
  readonly ACTION_SHARE_PROFILE: 'share-profile';
  readonly ACTION_EXPORT_DATA: 'export-data';
}

interface ProfilePageActionProviderProps {
  profileId: string,
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const PROFILE_ACTION_IDS = {
  EDIT_PROFILE: 'edit-profile',
  SHOW_SETTINGS: 'show-settings',
  SHARE_PROFILE: 'share-profile',
  EXPORT_DATA: 'export-data',
} as const;

export function ProfilePageActionProvider({
  profileId,
  children,
  onError,
  onSuccess,
}: ProfilePageActionProviderProps) {
  const router = useRouter();

  // Handler for editing profile
  const handleEditProfile = React.useCallback(async () => {
    try {
      // Start editing profile - this will show the editor interface
      router.push(`/profiles/${profileId}/edit`);
    } catch (error) {
      console.error('Failed to start editing profile:', error);
      throw error;
    }
  }, [router]);

  // Handler for settings
  const handleShowSettings = React.useCallback(async () => {
    try {
      // Navigate to settings page
      router.push('/settings');
    } catch (error) {
      console.error('Failed to navigate to settings:', error);
      throw error;
    }
  }, [router]);

  // Handler for sharing profile
  const handleShareProfile = React.useCallback(async () => {
    try {
      if (navigator.share && typeof window !== 'undefined') {
        await navigator.share({
          title: 'Profile',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        console.log('Profile link copied to clipboard');
        // TODO: Show toast notification
      }
    } catch (error) {
      console.error('Failed to share profile:', error);
      throw error;
    }
  }, []);

  // Handler for exporting data
  const handleExportData = React.useCallback(async () => {
    try {
      // Generate and download profile data export
      const profileData = {
        exportedAt: new Date().toISOString(),
        // This would include actual profile data in a real implementation
        message: 'Profile data export feature coming soon',
      };

      const dataStr = JSON.stringify(profileData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'profile-data.json';
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export profile data:', error);
      throw error;
    }
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: PROFILE_ACTION_IDS.EDIT_PROFILE,
      label: 'Edit Profile',
      icon: Edit,
      handler: handleEditProfile,
    },
    {
      id: PROFILE_ACTION_IDS.SHOW_SETTINGS,
      label: 'Settings',
      icon: Settings,
      handler: handleShowSettings,
    },
    {
      id: PROFILE_ACTION_IDS.SHARE_PROFILE,
      label: 'Share Profile',
      icon: Share,
      handler: handleShareProfile,
    },
    {
      id: PROFILE_ACTION_IDS.EXPORT_DATA,
      label: 'Export Data',
      icon: Download,
      handler: handleExportData,
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

export function useProfilePageActionContext() {
  const context = React.useContext(
    React.createContext<ProfilePageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useProfilePageActionContext must be used within a ProfilePageActionProvider'
    );
  }
  return context;
}
