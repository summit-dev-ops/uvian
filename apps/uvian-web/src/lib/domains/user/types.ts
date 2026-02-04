/**
 * User Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * Clear distinction between Users (authentication) and Profiles (user data).
 * All profile operations work consistently regardless of whether it's the current user or another user.
 */

export type ProfileType = 'human' | 'agent' | 'system' | 'admin';

// ============================================================================
// API Types (Raw data from REST endpoints)
// ============================================================================

export type ProfileAPI = {
  id: string;
  authUserId?: string | null;
  type: ProfileType;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields: any;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

export type SettingsAPI = {
  profileId: string;
  settings: any;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// Legacy aliases for backward compatibility during migration
export type UserProfileAPI = ProfileAPI;
export type UserSettingsAPI = SettingsAPI;

// ============================================================================
// UI Types (Transformed for UI consumption)
// ============================================================================

export type ProfileUI = {
  userId: string; // Keeping userId for backward compatibility in UI
  profileId: string;
  authUserId?: string | null;
  type: ProfileType;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SettingsUI = {
  userId: string; // Keeping userId for backward compatibility in UI
  profileId: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
};

// Legacy aliases for backward compatibility during migration
export type UserProfileUI = ProfileUI;
export type UserSettingsUI = SettingsUI;

// ============================================================================
// User Store Types (Local UI state)
// ============================================================================

export type ProfileDraft = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  isActive?: boolean;
  type?: ProfileType;
};

export type SettingsDraft = Record<string, any>;

export type UserSliceState = {
  profileDraft: ProfileDraft;
  settingsDraft: SettingsDraft;
  isEditingProfile: boolean;
  isEditingSettings: boolean;
};

// Legacy aliases for backward compatibility during migration
export type UserProfileDraft = ProfileDraft;
export type UserSettingsDraft = SettingsDraft;
