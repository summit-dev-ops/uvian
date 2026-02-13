import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateProfileData,
  Profile,
  ProfileSearchFilters,
  ProfileSearchResponse,
  SearchableField,
  UpdateProfileData,
} from '../types/profile.typs';
import { adminSupabase } from '../clients/supabase.client';

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
  async getCurrentProfileFromRequest(request: any): Promise<string> {
    if (!request.headers || !request.headers.profileId) {
      throw new Error('No profileId provided');
    }
    return request.headers.profileId;
  }

  // Profile CRUD operations
  async getProfile(
    supabaseClient: SupabaseClient,
    profileId: string,
    userId?: string
  ): Promise<Profile | undefined> {
    const { data, error } = await supabaseClient
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

  async getProfileByAuthUserId(
    supabaseClient: SupabaseClient,
    authUserId: string
  ): Promise<Profile | undefined> {
    const { data, error } = await supabaseClient
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

  async createProfile(
    supabaseClient: SupabaseClient,
    profileId: string,
    userId: string,
    data: CreateProfileData
  ): Promise<Profile> {
    // Validate required fields
    if (!data.displayName || data.displayName.trim().length === 0) {
      throw new Error('Display name is required');
    }

    const profileData = {
      id: profileId,
      auth_user_id: userId,
      type: data.type || 'human',
      display_name: data.displayName.trim(),
      avatar_url: data.avatarUrl || null,
      bio: data.bio || null,
      agent_config: data.agentConfig || null,
      public_fields: data.publicFields || {},
    };

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
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
    supabaseClient: SupabaseClient,
    profileId: string,
    userId: string,
    data: UpdateProfileData
  ): Promise<Profile> {
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

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .eq('auth_user_id', userId)
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

  async deleteProfile(
    supabaseClient: SupabaseClient,
    profileId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('auth_user_id', userId)
      .eq('id', profileId);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  async validateProfileExists(profileId: string): Promise<boolean> {
    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  async validateProfileIsOwnedByUser(
    profileId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .eq('auth_user_id', userId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  // Search functionality for profiles
  async searchProfiles(
    supabaseClient: SupabaseClient,
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
    let query = supabaseClient
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
