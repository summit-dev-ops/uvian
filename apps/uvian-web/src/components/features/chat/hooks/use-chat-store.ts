'use client';

import { useAppStore } from '~/components/providers/store/store-provider';
import { useCallback } from 'react';

export const useChatStore = (conversationId: string) => {
  const messageDraft = useAppStore(
    (state) =>
      state.conversationCache[conversationId]?.composition.messageDraft ?? ''
  );
  const setConversationMessageDraft = useAppStore(
    (state) => state.setConversationMessageDraft
  );

  const setDraft = useCallback(
    (newDraft: string) => {
      setConversationMessageDraft(conversationId, newDraft);
    },
    [conversationId, setConversationMessageDraft]
  );

  return {
    messageDraft,
    setMessageDraft: setDraft,
  };
};
