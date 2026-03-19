/**
 * Chat Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * All IDs (message and conversation) are UUIDs (v4).
 */

import type { ProfileUI } from '~/lib/domains/profile/types';
import type {
  Attachment,
  AttachmentType,
  FileAttachment,
  MentionAttachment,
  LinkAttachment,
} from '../posts/types';
export type {
  Attachment,
  AttachmentType,
  FileAttachment,
  MentionAttachment,
  LinkAttachment,
};
export type DataSyncStatus = 'synced' | 'pending' | 'error';

export type ConversationMemberUI = {
  userId: string;
  conversationId: string;
  role: ConversationMemberRole;
  createdAt: string;
  syncStatus: DataSyncStatus;
  profile?: ProfileUI;
};

export type ConversationMemberRole = {
  name: 'owner' | 'admin' | 'member';
};

export type MessageUI = {
  id: string; // UUID
  conversationId: string; // UUID
  senderId: string; // UUID - user ID of sender
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  syncStatus: DataSyncStatus;
  isStreaming?: boolean; // True if message is receiving tokens
  tokens?: string[]; // Array of tokens for streaming messages
  senderProfile?: ProfileUI;
  attachments?: Attachment[];
};

export type ConversationUI = {
  id: string; // UUID
  title: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: DataSyncStatus;
  lastMessage?: MessageUI;
};

// ============================================================================
// Conversation Cache Types (Local UI state per conversation)
// ============================================================================

export type ConversationMode = 'chat' | 'edit' | 'debug';

export type ConversationComposition = {
  messageDraft: string; // Draft message content
  attachments: Attachment[];
};

export type ConversationCacheEntry = {
  composition: ConversationComposition;
  mode: ConversationMode; // Current interaction mode
};

// ============================================================================
// Socket Event Types
// ============================================================================

export type SocketMessageEvent = {
  conversationId: string; // UUID
  message: MessageUI;
  isDelta?: boolean;
  isComplete?: boolean;
};

export type SocketTokenEvent = {
  conversationId: string; // UUID
  messageId: string; // UUID
  token: string;
  isComplete: boolean;
};

export type SocketConversationUpdateEvent = {
  conversationId: string; // UUID
  title?: string;
};

// ============================================================================
// Preview Data Types
// ============================================================================

export interface PreviewData {
  conversationId: string;
  lastMessage: MessageUI | null;
}
