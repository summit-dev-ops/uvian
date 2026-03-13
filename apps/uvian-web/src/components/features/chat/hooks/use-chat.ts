'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import type { MessageUI } from '~/lib/domains/chat/types';
import { useProfilesByUserId } from '../../user/hooks/use-profiles-by-user';

export const useChat = (conversationId: string) => {
  const queryClient = useQueryClient();
  // 1. Fetch messages using React Query
  const { data: messages, isLoading } = useQuery(
    chatQueries.messages(conversationId)
  );
  // 2. Fetch profiles for all message senders by userId
  const senderIds = messages?.map((m) => m.senderId) ?? [];
  const { profiles, isLoading: isLoadingProfiles } =
    useProfilesByUserId(senderIds);

  // 3. Enrich messages with profiles
  const enrichedMessages: MessageUI[] =
    messages?.map((message) => ({
      ...message,
      senderProfile: profiles[message.senderId],
    })) ?? [];

  // 4. Mutation for sending messages
  const { mutate: sendMessage, isPending: isSending } = useMutation(
    chatMutations.sendMessage(queryClient)
  );

  return {
    messages: enrichedMessages,
    isLoading: isLoading || isLoadingProfiles,
    sendMessage,
    isSending,
  };
};
