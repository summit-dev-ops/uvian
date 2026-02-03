'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { useEffect, useState } from 'react';
import { createClient } from '~/lib/supabase/client';

export const useConversationMembers = (conversationId: string) => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, [supabase]);

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
  const currentUserMember = members?.find((m) => m.userId === currentUserId);
  const isAdmin =
    currentUserMember?.role?.name === 'admin' ||
    currentUserMember?.role === 'admin';

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
    currentUserId,
    isAdmin,
  };
};
