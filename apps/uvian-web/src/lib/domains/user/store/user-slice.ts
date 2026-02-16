/**
 * User Domain Store Slice
 *
 * Zustand slice for local UI state management.
 * Manages profile drafts, settings drafts, and editing states.
 * Clean separation between Users (authentication) and Profiles (data).
 */

import type { StateCreator } from 'zustand';
import type { SettingsDraft } from '../types';

// ============================================================================
// Slice State
// ============================================================================

export interface UserSlice {
  activeProfileId?: string;
  // State
  settingsDraft: SettingsDraft;
  isEditingSettings: boolean;

  setActiveProfile: (newProfileId: string) => void;
  // Actions
  setSettingsDraft: (draft: SettingsDraft) => void;
  clearSettingsDraft: () => void;
  setIsEditingSettings: (isEditing: boolean) => void;
}

const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {};

// ============================================================================
// Slice Creator
// ============================================================================

export const createUserSlice: StateCreator<UserSlice> = (set, get) => ({
  activeProfileId: undefined,
  // Actions
  setActiveProfile: (newProfileId) => {
    console.log({newProfileId})
    set({ activeProfileId: newProfileId });
  },
  // Initial state
  settingsDraft: DEFAULT_SETTINGS_DRAFT,
  isEditingSettings: false,

  setSettingsDraft: (draft) => {
    set({ settingsDraft: draft });
  },

  clearSettingsDraft: () => {
    set({ settingsDraft: DEFAULT_SETTINGS_DRAFT });
  },

  setIsEditingSettings: (isEditing) => {
    set({ isEditingSettings: isEditing });
  },
});
