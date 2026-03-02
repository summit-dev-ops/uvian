'use client';

import { useAppStore } from '~/components/providers/store/store-provider';
import { useCallback } from 'react';
import type { Attachment } from '~/lib/domains/chat/types';

const EMPTY_ATTACHMENTS: Attachment[] = [];

export const useChatStore = (conversationId: string) => {
  const messageDraft = useAppStore(
    (state) =>
      state.conversationCache[conversationId]?.composition.messageDraft ?? ''
  );
  const attachments = useAppStore(
    (state) =>
      state.conversationCache[conversationId]?.composition.attachments ??
      EMPTY_ATTACHMENTS
  );
  const setConversationMessageDraft = useAppStore(
    (state) => state.setConversationMessageDraft
  );
  const setConversationAttachments = useAppStore(
    (state) => state.setConversationAttachments
  );

  const setDraft = useCallback(
    (newDraft: string) => {
      setConversationMessageDraft(conversationId, newDraft);
    },
    [conversationId, setConversationMessageDraft]
  );

  const setAttachments = useCallback(
    (newAttachments: Attachment[]) => {
      setConversationAttachments(conversationId, newAttachments);
    },
    [conversationId, setConversationAttachments]
  );

  return {
    messageDraft,
    setMessageDraft: setDraft,
    attachments,
    setAttachments,
  };
};
