/**
 * User Domain Store Slice
 *
 * Zustand slice for local UI state management.
 * Manages profile drafts, settings drafts, and editing states.
 * Clean separation between Users (authentication) and Profiles (data).
 */

import type { StateCreator } from 'zustand';
import type { ProfileDraft, SettingsDraft } from '../types';

// ============================================================================
// Slice State
// ============================================================================

export interface UserSlice {
  // State
  profileDraft: ProfileDraft;
  settingsDraft: SettingsDraft;
  isEditingProfile: boolean;
  isEditingSettings: boolean;

  // Actions
  setProfileDraft: (draft: ProfileDraft) => void;
  setSettingsDraft: (draft: SettingsDraft) => void;
  clearProfileDraft: () => void;
  clearSettingsDraft: () => void;
  setIsEditingProfile: (isEditing: boolean) => void;
  setIsEditingSettings: (isEditing: boolean) => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PROFILE_DRAFT: ProfileDraft = {
  displayName: '',
  avatarUrl: null,
  bio: null,
  publicFields: {},
};

const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {};

// ============================================================================
// Slice Creator
// ============================================================================

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  // Initial state
  profileDraft: DEFAULT_PROFILE_DRAFT,
  settingsDraft: DEFAULT_SETTINGS_DRAFT,
  isEditingProfile: false,
  isEditingSettings: false,

  // Actions
  setProfileDraft: (draft) => {
    set({ profileDraft: draft });
  },

  setSettingsDraft: (draft) => {
    set({ settingsDraft: draft });
  },

  clearProfileDraft: () => {
    set({ profileDraft: DEFAULT_PROFILE_DRAFT });
  },

  clearSettingsDraft: () => {
    set({ settingsDraft: DEFAULT_SETTINGS_DRAFT });
  },

  setIsEditingProfile: (isEditing) => {
    set({ isEditingProfile: isEditing });
  },

  setIsEditingSettings: (isEditing) => {
    set({ isEditingSettings: isEditing });
  },
});
