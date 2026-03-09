'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import {
  ConversationMemberRole,
  type ConversationMemberUI,
} from '~/lib/domains/chat/types';
import { useProfilesByUserId } from '../../user/hooks/use-profiles-by-user';

export const useConversationMembers = (conversationId: string) => {
  const queryClient = useQueryClient();

  // 1. Fetch members
  const { data: members, isLoading } = useQuery(
    chatQueries.conversationMembers(conversationId)
  );

  // 2. Fetch profiles for all members by userId
  const userIds = members?.map((m) => m.userId) ?? [];
  const { profiles, isLoading: isLoadingProfiles } =
    useProfilesByUserId(userIds);

  // 3. Enrich members with profiles
  const enrichedMembers: ConversationMemberUI[] =
    members?.map((member) => ({
      ...member,
      profile: profiles[member.userId],
    })) ?? [];

  // 4. Mutations
  const { mutate: inviteMember, isPending: isInviting } = useMutation(
    chatMutations.inviteConversationMember(queryClient)
  );

  const { mutate: removeMember, isPending: isRemoving } = useMutation(
    chatMutations.removeConversationMember(queryClient)
  );

  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation(
    chatMutations.updateConversationMemberRole(queryClient)
  );

  return {
    members: enrichedMembers,
    isLoading: isLoading || isLoadingProfiles,
    role: undefined,
    inviteMember: (
      targetMemberUserId: string,
      role: ConversationMemberRole
    ) => {
      inviteMember({
        conversationId,
        targetMemberUserId,
        role,
      });
    },
    removeMember: (targetMemberUserId: string) => {
      removeMember({
        conversationId,
        targetMemberUserId,
      });
    },
    updateRole: (targetMemberUserId: string, role: ConversationMemberRole) => {
      updateRole({
        conversationId,
        targetMemberUserId,
        role,
      });
    },
    isInviting,
    isRemoving,
    isUpdatingRole,
  };
};
