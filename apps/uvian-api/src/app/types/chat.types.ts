export interface Conversation {
  id: string;
  title: string;
  space_id?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMembership {
  profileId: string;
  conversationId: string;
  role: ConversationMembershipRole;
  createdAt: string;
}

export interface ConversationMembershipRole {
  name: 'owner' | 'admin' | 'member';
}
