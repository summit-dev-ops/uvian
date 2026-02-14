'use client';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import type { ConversationUI } from '~/lib/domains/chat/types';
import type { PreviewData } from '~/lib/domains/chat/types';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

interface UseConversationPreviewsReturn {
  previews: PreviewData[];
  loading: boolean;
  errors: Array<{ index: number; error: Error }>;
  isLoading: boolean;
}

export const useConversationPreviews = (
  conversations: ConversationUI[]
): UseConversationPreviewsReturn => {
  const { activeProfileId } = useUserSessionStore();
  const queries = useQueries({
    queries: conversations.map((conv) => ({
      ...chatQueries.messages(activeProfileId, conv.id),
      staleTime: 1000 * 60 * 2, // 2 minutes cache for previews
      select: (messages: any[]): PreviewData => ({
        conversationId: conv.id,
        lastMessage: messages?.[messages.length - 1] || null,
      }),
    })),
  });

  const previews = useMemo(
    () =>
      queries
        .map((q) => q.data)
        .filter((data): data is PreviewData => data !== undefined),
    [queries]
  );

  const loading = useMemo(() => queries.some((q) => q.isLoading), [queries]);

  const errors = useMemo(() => {
    return queries
      .map((q, index) => ({ index, error: q.error }))
      .filter(
        (item): item is { index: number; error: Error } => item.error !== null
      );
  }, [queries]);

  return {
    previews,
    loading,
    errors,
    isLoading: loading,
  };
};
