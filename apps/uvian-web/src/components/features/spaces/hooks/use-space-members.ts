'use client';

import { useQuery } from '@tanstack/react-query';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import type { SpaceMemberUI } from '~/lib/domains/spaces/types';
import { useProfilesByUserId } from '../../user/hooks/use-profiles-by-user';

export function useSpaceMembers(spaceId: string) {
  const {
    data: members,
    isLoading,
    error,
  } = useQuery(spacesQueries.spaceMembers(spaceId));

  const userIds = members?.map((m) => m.userId) ?? [];
  const { profiles, isLoading: isLoadingProfiles } =
    useProfilesByUserId(userIds);

  const enrichedMembers: SpaceMemberUI[] =
    members?.map((member) => ({
      ...member,
      profile: profiles[member.userId],
    })) ?? [];

  return {
    members: enrichedMembers,
    isLoading: isLoading || isLoadingProfiles,
    error,
  };
}
