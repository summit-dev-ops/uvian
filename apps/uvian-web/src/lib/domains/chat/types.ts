/**
 * Chat Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * All IDs (message and conversation) are UUIDs (v4).
 */

// ============================================================================
// API Types (Raw data from REST endpoints)
// ============================================================================

export type MessageAPI = {
  id: string; // UUID
  conversation_id: string; // UUID - database field name
  sender_id: string; // UUID - profile ID of sender (database field name)
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string; // ISO 8601 (database field name)
  updated_at: string; // ISO 8601 (database field name)
};

export type ConversationAPI = {
  id: string; // UUID
  title: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

export type ConversationMemberAPI = {
  profileId: string;
  conversationId: string;
  role: any;
  createdAt: string;
};

// ============================================================================
// UI Types (Transformed for UI consumption)
// ============================================================================

export type DataSyncStatus = 'synced' | 'pending' | 'error';

export type ConversationMemberUI = {
  profileId: string;
  conversationId: string;
  role: any;
  createdAt: Date;
  syncStatus: DataSyncStatus;
};

export type MessageUI = {
  id: string; // UUID
  conversationId: string; // UUID
  senderId: string; // UUID - profile ID of sender
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  syncStatus: DataSyncStatus;
  isStreaming?: boolean; // True if message is receiving tokens
  tokens?: string[]; // Array of tokens for streaming messages
};

export type ConversationUI = {
  id: string; // UUID
  title: string;
  createdAt: Date;
  syncStatus: DataSyncStatus;
  lastMessage?: MessageUI;
};

// ============================================================================
// Conversation Cache Types (Local UI state per conversation)
// ============================================================================

export type ConversationMode = 'chat' | 'edit' | 'debug';

export type ConversationComposition = {
  messageDraft: string; // Draft message content
  attachments: any[]; // Placeholder for attachments
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
  message: MessageAPI;
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
