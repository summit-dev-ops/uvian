/**
 * Spaces Domain Utilities
 *
 * Transformer functions and React Query cache update utilities.
 */

import { QueryClient } from '@tanstack/react-query';
import type { SpaceAPI, SpaceUI, SpaceMemberAPI, SpaceMemberUI } from './types';
import { spacesKeys } from './api/keys';

// ============================================================================
// Transformers (API → UI)
// ============================================================================

export function spaceApiToUi(raw: SpaceAPI): SpaceUI {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    avatarUrl: raw.avatar_url,
    createdBy: raw.created_by,
    settings: raw.settings,
    isPrivate: raw.is_private,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    memberCount: raw.member_count,
    conversationCount: raw.conversation_count,
    userRole: raw.user_role,
    syncStatus: 'synced',
  };
}

export function spaceMemberApiToUi(raw: SpaceMemberAPI): SpaceMemberUI {
  return {
    spaceId: raw.space_id,
    profileId: raw.profile_id,
    role: raw.role,
    joinedAt: new Date(raw.joined_at),
    profile: raw.profile
      ? {
          id: raw.profile.id,
          displayName: raw.profile.display_name,
          avatarUrl: raw.profile.avatar_url,
          type: raw.profile.type,
        }
      : undefined,
  };
}

// ============================================================================
// Cache Update Utilities
// ============================================================================

/**
 * Add a new space to the spaces list cache.
 */
export function addSpaceToCache(
  queryClient: QueryClient,
  space: SpaceUI
): void {
  queryClient.setQueryData<SpaceUI[]>(spacesKeys.list(), (oldSpaces) => {
    if (!oldSpaces) return [space];

    // Check if space already exists
    const existingIndex = oldSpaces.findIndex((s) => s.id === space.id);

    if (existingIndex !== -1) {
      // Update existing space
      return oldSpaces.map((s, idx) => (idx === existingIndex ? space : s));
    }

    // Add new space to the beginning
    return [space, ...oldSpaces];
  });
}

/**
 * Update a space in the cache.
 */
export function updateSpaceInCache(
  queryClient: QueryClient,
  updatedSpace: SpaceUI
): void {
  // Update specific space detail cache
  queryClient.setQueryData<SpaceUI>(
    spacesKeys.detail(updatedSpace.id),
    updatedSpace
  );

  // Update in spaces list cache
  queryClient.setQueryData<SpaceUI[]>(spacesKeys.list(), (oldSpaces) => {
    if (!oldSpaces) return [updatedSpace];

    return oldSpaces.map((space) =>
      space.id === updatedSpace.id ? updatedSpace : space
    );
  });
}

/**
 * Remove a space from the cache.
 */
export function removeSpaceFromCache(
  queryClient: QueryClient,
  spaceId: string
): void {
  // Remove from spaces list cache
  queryClient.setQueryData<SpaceUI[]>(
    spacesKeys.list(),
    (oldSpaces) => oldSpaces?.filter((space) => space.id !== spaceId) || []
  );

  // Remove specific space cache
  queryClient.removeQueries({
    queryKey: spacesKeys.detail(spaceId),
  });
  queryClient.removeQueries({
    queryKey: spacesKeys.members(spaceId),
  });
  queryClient.removeQueries({
    queryKey: spacesKeys.conversations(spaceId),
  });
}

/**
 * Update a member in the space members cache.
 */
export function updateMemberInCache(
  queryClient: QueryClient,
  spaceId: string,
  updatedMember: SpaceMemberUI
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(spaceId),
    (oldMembers) => {
      if (!oldMembers) return [updatedMember];

      return oldMembers.map((member) =>
        member.profileId === updatedMember.profileId ? updatedMember : member
      );
    }
  );
}

/**
 * Remove a member from the space members cache.
 */
export function removeMemberFromCache(
  queryClient: QueryClient,
  spaceId: string,
  profileId: string
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(spaceId),
    (oldMembers) =>
      oldMembers?.filter((member) => member.profileId !== profileId) || []
  );
}

/**
 * Add a member to the space members cache.
 */
export function addMemberToCache(
  queryClient: QueryClient,
  spaceId: string,
  newMember: SpaceMemberUI
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(spaceId),
    (oldMembers) => {
      if (!oldMembers) return [newMember];

      // Check if member already exists
      const exists = oldMembers.some(
        (member) => member.profileId === newMember.profileId
      );

      if (exists) {
        // Update existing member
        return oldMembers.map((member) =>
          member.profileId === newMember.profileId ? newMember : member
        );
      }

      // Add new member
      return [...oldMembers, newMember];
    }
  );
}

/**
 * Update space statistics in cache.
 */
export function updateSpaceStatsCache(
  queryClient: QueryClient,
  stats: any
): void {
  queryClient.setQueryData(spacesKeys.stats(), stats);
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export const spacesUtils = {
  spaceApiToUi,
  spaceMemberApiToUi,
  addSpaceToCache,
  updateSpaceInCache,
  removeSpaceFromCache,
  updateMemberInCache,
  removeMemberFromCache,
  addMemberToCache,
  updateSpaceStatsCache,
};
