import type { StateCreator } from 'zustand';
import type { ProfileDraft } from '../types';

export interface ProfileSlice {
  profileDraft: ProfileDraft;
  isEditingProfile: boolean;

  setProfileDraft: (draft: ProfileDraft) => void;
  clearProfileDraft: () => void;
  setIsEditingProfile: (isEditing: boolean) => void;
}

const DEFAULT_PROFILE_DRAFT: ProfileDraft = {
  displayName: '',
  avatarUrl: null,
  bio: null,
  publicFields: {},
};

// ============================================================================
// Slice Creator
// ============================================================================

export const createProfileSlice: StateCreator<ProfileSlice> = (set, get) => ({
  profileDraft: DEFAULT_PROFILE_DRAFT,
  isEditingProfile: false,

  // Actions
  setProfileDraft: (draft) => {
    set({ profileDraft: draft });
  },

  clearProfileDraft: () => {
    set({ profileDraft: DEFAULT_PROFILE_DRAFT });
  },

  setIsEditingProfile: (isEditing) => {
    set({ isEditingProfile: isEditing });
  },
});
