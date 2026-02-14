import { Profile } from './profile.types';

export interface UserSettings {
  userId: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfiles {
  profiles: Profile[];
}

export type GetUserSettingsRequest = any;

export interface UpdateUserSettingsRequest {
  Body: { settings: Record<string, any> };
}

export type DeleteUserSettingsRequest = any;

export type GetUserProfilesRequest = any;
