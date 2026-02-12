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

export interface SearchableField {
  name: string;
  weight: number;
  boost?: number;
}

export interface ProfileSearchFilters {
  query?: string;
  type?: ('human' | 'agent')[];
  sortBy?: 'relevance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProfileSearchResponse {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  sortBy: 'relevance' | 'createdAt';
  query: string;
  searchFields: string[];
}

export interface RelevanceScore {
  profileId: string;
  score: number;
  matchedFields: string[];
}

// Search configuration - easily extensible
const SEARCH_CONFIG = {
  fields: [
    { name: 'display_name', weight: 2.0, boost: 2.0 }, // High priority
    { name: 'bio', weight: 1.0, boost: 1.0 }, // Lower priority
    // Future additions: skills, location, etc.
  ],
  maxResultsPerPage: 100,
  defaultPageSize: 20,
};

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
    console.log(error);
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

  // Search functionality for profiles
  async searchProfiles(
    filters: ProfileSearchFilters
  ): Promise<ProfileSearchResponse> {
    // Apply defaults
    const searchFilters = {
      query: filters.query?.trim() || '',
      type: filters.type || ['human', 'agent'],
      sortBy: filters.sortBy || 'relevance',
      sortOrder: filters.sortOrder || 'desc',
      page: Math.max(1, filters.page || 1),
      limit: Math.min(
        SEARCH_CONFIG.maxResultsPerPage,
        Math.max(1, filters.limit || SEARCH_CONFIG.defaultPageSize)
      ),
    };

    const offset = (searchFilters.page - 1) * searchFilters.limit;

    // Base query - only public, active profiles
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .in('type', searchFilters.type);

    // Apply text search if query provided
    if (searchFilters.query) {
      const searchTerm = `%${searchFilters.query}%`;
      query = query.or(
        `display_name.ilike.${searchTerm},bio.ilike.${searchTerm}`
      );
    }

    // Apply sorting
    if (searchFilters.sortBy === 'createdAt') {
      query = query.order('created_at', {
        ascending: searchFilters.sortOrder === 'asc',
      });
    } else {
      // For relevance search, we'll get all matches and sort by relevance score
      query = query.order('created_at', { ascending: false }); // Temporary, will be re-sorted
    }

    // Apply pagination
    query = query.range(offset, offset + searchFilters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search profiles: ${error.message}`);
    }

    // Transform database results to Profile interface
    let profiles: Profile[] = data.map((profile) => ({
      id: profile.id,
      authUserId: profile.auth_user_id || undefined,
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

    // Apply relevance scoring if needed
    if (searchFilters.sortBy === 'relevance' && searchFilters.query) {
      profiles = this.applyRelevanceScoring(profiles, searchFilters.query);
    }

    // Calculate pagination info
    const total = count || 0;
    const hasMore = offset + profiles.length < total;

    return {
      profiles,
      total,
      page: searchFilters.page,
      limit: searchFilters.limit,
      hasMore,
      sortBy: searchFilters.sortBy,
      query: searchFilters.query,
      searchFields: SEARCH_CONFIG.fields.map((f) => f.name),
    };
  }

  // Calculate relevance scores for search results
  private applyRelevanceScoring(profiles: Profile[], query: string): Profile[] {
    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    const scoredProfiles = profiles.map((profile) => {
      let score = 0;
      const matchedFields: string[] = [];

      // Score based on search fields configuration
      for (const field of SEARCH_CONFIG.fields) {
        const fieldValue = this.getFieldValue(profile, field.name);
        if (fieldValue && typeof fieldValue === 'string') {
          const fieldScore = this.calculateFieldScore(
            fieldValue,
            searchTerms,
            field
          );
          if (fieldScore > 0) {
            score += fieldScore * field.weight;
            matchedFields.push(field.name);
          }
        }
      }

      return {
        profile,
        score,
        matchedFields,
      };
    });

    // Sort by relevance score (descending), then by creation date for ties
    return scoredProfiles
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) < 0.01) {
          // If scores are very close, sort by creation date
          return (
            new Date(b.profile.createdAt).getTime() -
            new Date(a.profile.createdAt).getTime()
          );
        }
        return b.score - a.score;
      })
      .map((item) => item.profile);
  }

  // Get field value from profile object
  private getFieldValue(profile: Profile, fieldName: string): string | null {
    switch (fieldName) {
      case 'display_name':
        return profile.displayName || null;
      case 'bio':
        return profile.bio || null;
      default:
        return null;
    }
  }

  // Calculate score for a specific field
  private calculateFieldScore(
    fieldValue: string,
    searchTerms: string[],
    field: SearchableField
  ): number {
    const fieldText = fieldValue.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      // Exact phrase match (highest weight)
      if (fieldText.includes(term)) {
        score += 10 * (field.boost || 1);

        // Bonus for exact word matches
        const exactMatch = new RegExp(
          `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        );
        if (exactMatch.test(fieldText)) {
          score += 5 * (field.boost || 1);
        }
      }
    }

    return score;
  }
}

export const profileService = new ProfileService();
