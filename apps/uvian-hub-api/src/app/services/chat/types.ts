export interface Conversation {
  id: string;
  title: string;
  spaceId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced';
  lastMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  updatedAt: string;
  attachments: unknown[];
  syncStatus: 'synced';
}

export interface ConversationMembership {
  userId: string;
  conversationId: string;
  role: { name: string };
  createdAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export interface ChatScopedService {
  getConversations(): Promise<Conversation[]>;
  getConversation(conversationId: string): Promise<Conversation>;
  getConversationMembers(
    conversationId: string
  ): Promise<ConversationMembership[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  searchMessages(
    conversationId: string,
    options: {
      q?: string;
      senderId?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Message[]>;
  createConversation(
    userId: string,
    data: { id?: string; title: string; spaceId?: string }
  ): Promise<Conversation>;
  createMessage(
    userId: string,
    conversationId: string,
    data: {
      id: string;
      content: string;
      role?: string;
      attachments?: unknown[];
    }
  ): Promise<Message>;
  updateMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    content: string,
    attachments?: unknown[]
  ): Promise<Message>;
  deleteMessage(
    userId: string,
    conversationId: string,
    messageId: string
  ): Promise<{ success: boolean }>;
  deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<{ success: boolean }>;
  inviteMember(
    userId: string,
    conversationId: string,
    targetUserId: string,
    role: { name: string }
  ): Promise<ConversationMembership>;
  removeMember(
    userId: string,
    conversationId: string,
    targetUserId: string
  ): Promise<{ success: boolean }>;
  updateMemberRole(
    userId: string,
    conversationId: string,
    targetUserId: string,
    role: { name: string }
  ): Promise<ConversationMembership>;
}

export interface ChatAdminService {
  // Placeholder for future admin-only methods
}

export interface CreateChatServiceConfig {}
