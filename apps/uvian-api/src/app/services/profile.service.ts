import { supabase } from './supabase.service';

export type ProfileType = 'human' | 'agent' | 'system' | 'admin';

export interface Profile {
  id: string;
  authUserId?: string | null;
  type: ProfileType;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSettings {
  profileId: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileData {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  type?: ProfileType;
}

export interface UpdateProfileData {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  isActive?: boolean;
}

export class ProfileService {
  // Profile CRUD operations
  async getProfile(
    profileId: string,
    requesterId?: string
  ): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!data) {
      return undefined;
    }

    // Transform database format to interface format
    return {
      id: data.id,
      authUserId: data.auth_user_id,
      type: data.type,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      agentConfig: data.agent_config,
      publicFields: data.public_fields,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createProfile(
    authUserId: string | null,
    data: CreateProfileData
  ): Promise<Profile> {
    // Validate required fields
    if (!data.displayName || data.displayName.trim().length === 0) {
      throw new Error('Display name is required');
    }

    const profileData = {
      auth_user_id: authUserId,
      type: data.type || 'human',
      display_name: data.displayName.trim(),
      avatar_url: data.avatarUrl || null,
      bio: data.bio || null,
      agent_config: data.agentConfig || null,
      public_fields: data.publicFields || {},
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    // Create default settings if human profile
    if (!authUserId || (data.type && data.type !== 'agent')) {
      const profileId = profile.id;
      await this.createSettings(profileId, {});
    }

    // Transform database format to interface format
    return {
      id: profile.id,
      authUserId: profile.auth_user_id,
      type: profile.type,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      agentConfig: profile.agent_config,
      publicFields: profile.public_fields,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async updateProfile(
    profileId: string,
    data: UpdateProfileData
  ): Promise<Profile> {
    // Build update object dynamically
    const updateData: any = {};

    if (data.displayName !== undefined) {
      if (!data.displayName || data.displayName.trim().length === 0) {
        throw new Error('Display name cannot be empty');
      }
      updateData.display_name = data.displayName.trim();
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatar_url = data.avatarUrl || null;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio || null;
    }

    if (data.agentConfig !== undefined) {
      updateData.agent_config = data.agentConfig || null;
    }

    if (data.publicFields !== undefined) {
      updateData.public_fields = data.publicFields || {};
    }

    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    // Transform database format to interface format
    return {
      id: profile.id,
      authUserId: profile.auth_user_id,
      type: profile.type,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      agentConfig: profile.agent_config,
      publicFields: profile.public_fields,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  // Get profile by auth user ID (for authenticated users)
  async getProfileByAuthUserId(
    authUserId: string
  ): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!data) {
      return undefined;
    }

    // Transform database format to interface format
    return {
      id: data.id,
      authUserId: data.auth_user_id,
      type: data.type,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      agentConfig: data.agent_config,
      publicFields: data.public_fields,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Settings CRUD operations
  async getSettings(profileId: string): Promise<ProfileSettings | undefined> {
    const { data, error } = await supabase
      .from('profile_settings')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    if (!data) {
      return undefined;
    }

    // Transform database format to interface format
    return {
      profileId: data.profile_id,
      settings: data.settings,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createSettings(
    profileId: string,
    settings: Record<string, any> = {}
  ): Promise<ProfileSettings> {
    const { data: settingsRecord, error } = await supabase
      .from('profile_settings')
      .insert({
        profile_id: profileId,
        settings: settings,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create settings: ${error.message}`);
    }

    // Transform database format to interface format
    return {
      profileId: settingsRecord.profile_id,
      settings: settingsRecord.settings,
      createdAt: settingsRecord.created_at,
      updatedAt: settingsRecord.updated_at,
    };
  }

  async updateSettings(
    profileId: string,
    settings: Record<string, any>
  ): Promise<ProfileSettings> {
    // First check if settings exist
    const existingSettings = await this.getSettings(profileId);

    if (!existingSettings) {
      // Create new settings if they don't exist
      return this.createSettings(profileId, settings);
    }

    // Merge new settings with existing ones
    const mergedSettings = {
      ...existingSettings.settings,
      ...settings,
    };

    const { data: settingsRecord, error } = await supabase
      .from('profile_settings')
      .update({
        settings: mergedSettings,
      })
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    // Transform database format to interface format
    return {
      profileId: settingsRecord.profile_id,
      settings: settingsRecord.settings,
      createdAt: settingsRecord.created_at,
      updatedAt: settingsRecord.updated_at,
    };
  }

  async deleteSettings(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_settings')
      .delete()
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Failed to delete settings: ${error.message}`);
    }
  }

  // Utility methods
  async getCurrentUserFromRequest(request: any): Promise<string> {
    if (!request.user || !request.user.id) {
      throw new Error('User not authenticated');
    }
    return request.user.id;
  }

  async getCurrentProfileFromRequest(
    request: any
  ): Promise<Profile | undefined> {
    const authUserId = await this.getCurrentUserFromRequest(request);
    return this.getProfileByAuthUserId(authUserId);
  }

  async validateProfileExists(profileId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  // Agent-specific methods
  async createAgentProfile(
    data: CreateProfileData,
    createdByAuthUserId: string
  ): Promise<Profile> {
    return this.createProfile(null, {
      ...data,
      type: 'agent',
    });
  }

  async getAgentProfiles(createdByAuthUserId?: string): Promise<Profile[]> {
    let query = supabase.from('profiles').select('*').eq('type', 'agent');

    if (createdByAuthUserId) {
      query = query.eq('auth_user_id', createdByAuthUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch agent profiles: ${error.message}`);
    }

    return data.map((profile) => ({
      id: profile.id,
      authUserId: profile.auth_user_id,
      type: profile.type,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      agentConfig: profile.agent_config,
      publicFields: profile.public_fields,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }));
  }
}

export const profileService = new ProfileService();
