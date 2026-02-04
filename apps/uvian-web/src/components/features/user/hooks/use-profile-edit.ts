'use client';

import { useAppStore } from '~/components/providers/store/store-provider';
import type { ProfileDraft, SettingsDraft } from '~/lib/domains/user/types';

/**
 * Hook for managing profile editing state via Zustand store.
 * Provides access to draft data and editing controls.
 */
export const useProfileEdit = () => {
  // Profile editing state
  const profileDraft = useAppStore((state) => state.profileDraft);
  const isEditingProfile = useAppStore((state) => state.isEditingProfile);

  // Settings editing state
  const settingsDraft = useAppStore((state) => state.settingsDraft);
  const isEditingSettings = useAppStore((state) => state.isEditingSettings);

  // Profile actions
  const setProfileDraft = useAppStore((state) => state.setProfileDraft);
  const clearProfileDraft = useAppStore((state) => state.clearProfileDraft);
  const setIsEditingProfile = useAppStore((state) => state.setIsEditingProfile);

  // Settings actions
  const setSettingsDraft = useAppStore((state) => state.setSettingsDraft);
  const clearSettingsDraft = useAppStore((state) => state.clearSettingsDraft);
  const setIsEditingSettings = useAppStore(
    (state) => state.setIsEditingSettings
  );

  // 1. Profile editing helpers
  const startEditingProfile = (initialDraft?: Partial<ProfileDraft>) => {
    if (initialDraft) {
      setProfileDraft({
        displayName: initialDraft.displayName || '',
        avatarUrl: initialDraft.avatarUrl || null,
        bio: initialDraft.bio || null,
        publicFields: initialDraft.publicFields || {},
      });
    }
    setIsEditingProfile(true);
  };

  const stopEditingProfile = () => {
    setIsEditingProfile(false);
    clearProfileDraft();
  };

  const saveProfileDraft = (draft: ProfileDraft) => {
    setProfileDraft(draft);
  };

  const updateProfileField = <K extends keyof ProfileDraft>(
    field: K,
    value: ProfileDraft[K]
  ) => {
    setProfileDraft({
      ...profileDraft,
      [field]: value,
    });
  };

  // 2. Settings editing helpers
  const startEditingSettings = (initialDraft?: Partial<SettingsDraft>) => {
    if (initialDraft) {
      setSettingsDraft({
        ...initialDraft,
      });
    }
    setIsEditingSettings(true);
  };

  const stopEditingSettings = () => {
    setIsEditingSettings(false);
    clearSettingsDraft();
  };

  const saveSettingsDraft = (draft: SettingsDraft) => {
    setSettingsDraft(draft);
  };

  const updateSettingsField = (field: string, value: any) => {
    setSettingsDraft({
      ...settingsDraft,
      [field]: value,
    });
  };

  // 3. Combined operations
  const startEditingBoth = (
    profileInit?: Partial<ProfileDraft>,
    settingsInit?: Partial<SettingsDraft>
  ) => {
    startEditingProfile(profileInit);
    startEditingSettings(settingsInit);
  };

  const stopEditingBoth = () => {
    stopEditingProfile();
    stopEditingSettings();
  };

  // 4. Load current data into drafts (useful for editing)
  const loadCurrentDataIntoDrafts = (
    currentProfile?: ProfileDraft,
    currentSettings?: SettingsDraft
  ) => {
    if (currentProfile) {
      setProfileDraft(currentProfile);
    }
    if (currentSettings) {
      setSettingsDraft(currentSettings);
    }
  };

  // 5. Validation helpers
  const validateProfileDraft = (draft: ProfileDraft): string[] => {
    const errors: string[] = [];

    if (!draft.displayName || draft.displayName.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (draft.displayName && draft.displayName.length > 100) {
      errors.push('Display name must be 100 characters or less');
    }

    if (draft.bio && draft.bio.length > 500) {
      errors.push('Bio must be 500 characters or less');
    }

    if (
      draft.avatarUrl &&
      !draft.avatarUrl.match(
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
      )
    ) {
      errors.push('Avatar URL must be a valid URL');
    }

    return errors;
  };

  const validateSettingsDraft = (draft: SettingsDraft): string[] => {
    const errors: string[] = [];

    // Settings can be any object, so minimal validation
    if (draft && typeof draft !== 'object') {
      errors.push('Settings must be a valid object');
    }

    return errors;
  };

  // 6. Draft state helpers
  const hasUnsavedProfileChanges = (currentProfile?: ProfileDraft): boolean => {
    if (!currentProfile) return profileDraft.displayName.length > 0;
    return (
      profileDraft.displayName !== currentProfile.displayName ||
      profileDraft.avatarUrl !== currentProfile.avatarUrl ||
      profileDraft.bio !== currentProfile.bio ||
      JSON.stringify(profileDraft.publicFields) !==
        JSON.stringify(currentProfile.publicFields)
    );
  };

  const hasUnsavedSettingsChanges = (
    currentSettings?: SettingsDraft
  ): boolean => {
    if (!currentSettings) return Object.keys(settingsDraft).length > 0;
    return JSON.stringify(settingsDraft) !== JSON.stringify(currentSettings);
  };

  return {
    // Profile editing state
    profileDraft,
    isEditingProfile,

    // Settings editing state
    settingsDraft,
    isEditingSettings,

    // Profile editing actions
    startEditingProfile,
    stopEditingProfile,
    saveProfileDraft,
    updateProfileField,
    clearProfileDraft,

    // Settings editing actions
    startEditingSettings,
    stopEditingSettings,
    saveSettingsDraft,
    updateSettingsField,
    clearSettingsDraft,

    // Combined operations
    startEditingBoth,
    stopEditingBoth,
    loadCurrentDataIntoDrafts,

    // Validation
    validateProfileDraft,
    validateSettingsDraft,

    // State helpers
    hasUnsavedProfileChanges,
    hasUnsavedSettingsChanges,

    // Computed values
    isEditingAny: isEditingProfile || isEditingSettings,
    hasProfileDraft: profileDraft.displayName.length > 0,
    hasSettingsDraft: Object.keys(settingsDraft).length > 0,
  };
};
