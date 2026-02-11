'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { userQueries } from '~/lib/domains/user/api';

export const useConversationMembers = (conversationId: string) => {
  const queryClient = useQueryClient();

  // 2. Fetch current user's profile
  const { data: profile } = useQuery({
    ...userQueries.profile(),
    enabled: !!conversationId, // Only fetch profile if we have a conversation
  });
  
  // 1. Fetch members
  const { data: members, isLoading } = useQuery(
    chatQueries.conversationMembers(conversationId)
  );

  // 2. Mutations
  const { mutate: inviteMember, isPending: isInviting } = useMutation(
    chatMutations.inviteConversationMember(queryClient)
  );

  const { mutate: removeMember, isPending: isRemoving } = useMutation(
    chatMutations.removeConversationMember(queryClient)
  );

  const { mutate: updateRole, isPending: isUpdatingRole } = useMutation(
    chatMutations.updateConversationMemberRole(queryClient)
  );

  // 3. Derived State
  const currentUserMember = members?.find((m) => m.profileId === profile?.profileId)
  const isAdmin =
    currentUserMember?.role?.name === 'admin' ||
    currentUserMember?.role === 'admin';
  console.log(isAdmin)
  return {
    members,
    isLoading,
    inviteMember: (userId: string, role: any) =>
      inviteMember({ conversationId, userId, role }),
    removeMember: (userId: string) => removeMember({ conversationId, userId }),
    updateRole: (userId: string, role: any) =>
      updateRole({ conversationId, userId, role }),
    isInviting,
    isRemoving,
    isUpdatingRole,
    currentProfileId: profile?.profileId,
    isAdmin,
  };
};
