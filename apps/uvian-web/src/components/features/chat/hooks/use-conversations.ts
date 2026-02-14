'use client';

import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

/**
 * Hook to fetch all conversations for the user.
 */
export const useConversations = () => {
  const { activeProfileId } = useUserSessionStore();
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery(chatQueries.conversations(activeProfileId));

  return {
    conversations,
    isLoading,
    error,
  };
};
