import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | undefined;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ProfileScopedService {
  getProfile(profileId: string): Promise<Profile>;
  getProfileByUserId(userId: string): Promise<Profile>;
  createOrUpdateProfile(
    userId: string,
    data: CreateOrUpdateProfileInput
  ): Promise<Profile>;
  updateProfile(
    userId: string,
    profileId: string,
    data: CreateOrUpdateProfileInput
  ): Promise<Profile>;
  deleteProfile(
    userId: string,
    profileId: string
  ): Promise<{ success: boolean }>;
}

export interface ProfileAdminService {
  // Placeholder for future admin-only methods
}

export interface CreateProfileServiceConfig {}
