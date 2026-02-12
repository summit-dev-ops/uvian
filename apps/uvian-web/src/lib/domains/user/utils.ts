/**
 * User Domain Utilities
 *
 * Transformer functions for converting API data to UI data.
 * All transformers are unified - profiles are profiles regardless of ownership.
 */

import type {
  ProfileAPI,
  ProfileUI,
  SettingsAPI,
  SettingsUI,
  UserSearchResults,
  ProfileSearchResponseAPI,
} from './types';

// ============================================================================
// Transformers (API → UI)
// ============================================================================

export function profileApiToUi(raw: ProfileAPI): ProfileUI {
  return {
    userId: raw.authUserId || raw.id, // Backward compatibility: use authUserId if available, fallback to id
    profileId: raw.id,
    authUserId: raw.authUserId,
    type: raw.type,
    displayName: raw.displayName,
    avatarUrl: raw.avatarUrl,
    bio: raw.bio,
    agentConfig: raw.agentConfig,
    publicFields: raw.publicFields,
    isActive: raw.isActive,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export function settingsApiToUi(raw: SettingsAPI): SettingsUI {
  return {
    userId: raw.profileId, // Backward compatibility: map profileId to userId
    profileId: raw.profileId,
    settings: raw.settings,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

// Legacy function for backward compatibility
export function publicProfileApiToUi(raw: ProfileAPI): ProfileUI {
  return profileApiToUi(raw);
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export function searchResultsApiToUi(
  raw: ProfileSearchResponseAPI
): UserSearchResults {
  return {
    profiles: raw.profiles.map(profileApiToUi),
    pagination: {
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
      hasMore: raw.hasMore,
    },
    filters: {
      query: raw.query,
      sortBy: raw.sortBy,
      searchFields: raw.searchFields,
    },
  };
}

export const userUtils = {
  profileApiToUi,
  settingsApiToUi,
  publicProfileApiToUi,
  searchResultsApiToUi,
};
