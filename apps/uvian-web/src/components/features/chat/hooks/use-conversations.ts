'use client';

import { useQuery } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';

/**
 * Hook to fetch all conversations for the user.
 */
export const useConversations = () => {
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery(chatQueries.conversations());

  return {
    conversations,
    isLoading,
    error,
  };
};
