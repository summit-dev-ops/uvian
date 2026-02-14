'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { useUserSessionStore } from '../../user/hooks/use-user-store';
import { ConversationMemberRole } from '~/lib/domains/chat/types';

export const useConversationMembers = (conversationId: string) => {
  const { activeProfileId } = useUserSessionStore();
  const queryClient = useQueryClient();

  // 1. Fetch members
  const { data: members, isLoading } = useQuery(
    chatQueries.conversationMembers(activeProfileId, conversationId)
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
  const currentUserMember = members?.find(
    (m) => m.profileId === activeProfileId
  );
  const isAdmin = currentUserMember?.role?.name === 'admin';
  return {
    members,
    isLoading,
    inviteMember: (
      targetMemberProfileId: string,
      role: ConversationMemberRole
    ) =>
      inviteMember({
        conversationId,
        authProfileId: activeProfileId,
        targetMemberProfileId,
        role,
      }),
    removeMember: (targetMemberProfileId: string) =>
      removeMember({
        conversationId,
        authProfileId: activeProfileId,
        targetMemberProfileId,
      }),
    updateRole: (targetMemberProfileId: string, role: ConversationMemberRole) =>
      updateRole({
        conversationId,
        targetMemberProfileId,
        authProfileId: activeProfileId,
        role,
      }),
    isInviting,
    isRemoving,
    isUpdatingRole,
    currentProfileId: activeProfileId,
    isAdmin,
  };
};
