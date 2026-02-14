/**
 * User Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * Clear distinction between Users (authentication) and Profiles (user data).
 * All profile operations work consistently regardless of whether it's the current user or another user.
 */

export type SettingsUI = {
  userId: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
};

export type SettingsDraft = Record<string, any>;
