/**
 * Spaces Domain Utilities
 *
 * Transformer functions and React Query cache update utilities.
 */

import { QueryClient } from '@tanstack/react-query';
import type { SpaceUI, SpaceMemberUI } from './types';
import { spacesKeys } from './api/keys';

// ============================================================================
// Cache Update Utilities
// ============================================================================

/**
 * Add a new space to the spaces list cache.
 */
export function addSpaceToCache(
  queryClient: QueryClient,
  authProfileId: string,
  space: SpaceUI
): void {
  queryClient.setQueryData<SpaceUI[]>(
    spacesKeys.list(authProfileId),
    (oldSpaces) => {
      if (!oldSpaces) return [space];

      // Check if space already exists
      const existingIndex = oldSpaces.findIndex((s) => s.id === space.id);

      if (existingIndex !== -1) {
        // Update existing space
        return oldSpaces.map((s, idx) => (idx === existingIndex ? space : s));
      }

      // Add new space to the beginning
      return [space, ...oldSpaces];
    }
  );
}

/**
 * Update a space in the cache.
 */
export function updateSpaceInCache(
  queryClient: QueryClient,
  authProfileId: string,
  updatedSpace: SpaceUI
): void {
  // Update specific space detail cache
  queryClient.setQueryData<SpaceUI>(
    spacesKeys.detail(authProfileId, updatedSpace.id),
    updatedSpace
  );

  // Update in spaces list cache
  queryClient.setQueryData<SpaceUI[]>(
    spacesKeys.list(authProfileId),
    (oldSpaces) => {
      if (!oldSpaces) return [updatedSpace];

      return oldSpaces.map((space) =>
        space.id === updatedSpace.id ? updatedSpace : space
      );
    }
  );
}

/**
 * Remove a space from the cache.
 */
export function removeSpaceFromCache(
  queryClient: QueryClient,
  authProfileId: string,
  spaceId: string
): void {
  // Remove from spaces list cache
  queryClient.setQueryData<SpaceUI[]>(
    spacesKeys.list(authProfileId),
    (oldSpaces) => oldSpaces?.filter((space) => space.id !== spaceId) || []
  );

  // Remove specific space cache
  queryClient.removeQueries({
    queryKey: spacesKeys.detail(authProfileId, spaceId),
  });
  queryClient.removeQueries({
    queryKey: spacesKeys.members(authProfileId, spaceId),
  });
  queryClient.removeQueries({
    queryKey: spacesKeys.conversations(authProfileId, spaceId),
  });
}

/**
 * Update a member in the space members cache.
 */
export function updateMemberInCache(
  queryClient: QueryClient,
  authProfileId: string,
  spaceId: string,
  updatedMember: SpaceMemberUI
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(authProfileId, spaceId),
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
  authProfileId: string,
  spaceId: string,
  profileId: string
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(authProfileId, spaceId),
    (oldMembers) =>
      oldMembers?.filter((member) => member.profileId !== profileId) || []
  );
}

/**
 * Add a member to the space members cache.
 */
export function addMemberToCache(
  queryClient: QueryClient,
  authProfileId: string,
  spaceId: string,
  newMember: SpaceMemberUI
): void {
  queryClient.setQueryData<SpaceMemberUI[]>(
    spacesKeys.members(authProfileId, spaceId),
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
  authProfileId: string,
  stats: any
): void {
  queryClient.setQueryData(spacesKeys.stats(authProfileId), stats);
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export const spacesUtils = {
  addSpaceToCache,
  updateSpaceInCache,
  removeSpaceFromCache,
  updateMemberInCache,
  removeMemberFromCache,
  addMemberToCache,
  updateSpaceStatsCache,
};
