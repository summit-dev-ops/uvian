/**
 * Chat Domain Store Slice
 *
 * Zustand slice for local UI state management.
 * Manages active conversation, conversation cache (drafts + modes), and composing state.
 */

import type { StateCreator } from 'zustand';
import type { ConversationCacheEntry, ConversationMode } from '../types';

// ============================================================================
// Slice State
// ============================================================================

export interface ChatSlice {
  // State
  activeConversationId: string | null;
  conversationCache: Record<string, ConversationCacheEntry>;
  isComposing: boolean;

  // Actions
  setActiveConversation: (conversationId: string | null) => void;
  setConversationMessageDraft: (
    conversationId: string,
    messageDraft: string
  ) => void;
  setConversationMode: (conversationId: string, mode: ConversationMode) => void;
  clearConversationCache: (conversationId: string) => void;
  getOrCreateCacheEntry: (conversationId: string) => ConversationCacheEntry;
  setIsComposing: (isComposing: boolean) => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_CACHE_ENTRY: ConversationCacheEntry = {
  composition: {
    messageDraft: '',
    attachments: [],
  },
  mode: 'chat',
};

// ============================================================================
// Slice Creator
// ============================================================================

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  // Initial state
  activeConversationId: null,
  conversationCache: {},
  isComposing: false,

  // Actions
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
  },

  setConversationMessageDraft: (conversationId, messageDraft) => {
    set((state) => {
      const entry = state.conversationCache[conversationId] || {
        ...DEFAULT_CACHE_ENTRY,
      };

      return {
        conversationCache: {
          ...state.conversationCache,
          [conversationId]: {
            ...entry,
            composition: {
              ...entry.composition,
              messageDraft,
            },
          },
        },
      };
    });
  },

  setConversationMode: (conversationId, mode) => {
    set((state) => {
      const entry = state.conversationCache[conversationId] || {
        ...DEFAULT_CACHE_ENTRY,
      };

      return {
        conversationCache: {
          ...state.conversationCache,
          [conversationId]: {
            ...entry,
            mode,
          },
        },
      };
    });
  },

  clearConversationCache: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...rest } = state.conversationCache;
      return { conversationCache: rest };
    });
  },

  getOrCreateCacheEntry: (conversationId) => {
    const state = get();
    return state.conversationCache[conversationId] || DEFAULT_CACHE_ENTRY;
  },

  setIsComposing: (isComposing) => {
    set({ isComposing });
  },
});
