export interface Conversation {
  id: string;
  title: string;
  spaceId?: string;
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

export interface CreateConversationPayload {
  id?: string;
  title: string;
  profileId: string;
}

export interface InviteConversationMemberPayload {
  profileId: string;
  role?: ConversationMembershipRole;
}

export interface UpdateConversationMemberRolePayload {
  role: ConversationMembershipRole;
}

export interface CreateMessagePayload {
  id: string;
  senderId: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
}

export interface CreateConversationRequest {
  Body: CreateConversationPayload;
}

export interface GetConversationsRequest {
  Headers: {
    profileId: string;
  };
}
export interface GetConversationRequest {
  Params: {
    conversationId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface GetConversationMembersRequest {
  Params: {
    conversationId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface InviteConversationMemberRequest {
  Params: { conversationId: string };
  Body: InviteConversationMemberPayload;
  Headers: {
    profileId: string;
  };
}

export interface DeleteConversationMemberRequest {
  Params: { conversationId: string; profileId: string };
  Headers: {
    profileId: string;
  };
}

export interface UpdateConversationMemberRoleRequest {
  Params: { conversationId: string; profileId: string };
  Body: UpdateConversationMemberRolePayload;
  Headers: {
    profileId: string;
  };
}

export interface CreateMessageRequest {
  Params: { conversationId: string };
  Body: CreateMessagePayload;
  Headers: {
    profileId: string;
  };
}
export interface GetMessagesRequest {
  Params: { conversationId: string };
  Headers: {
    profileId: string;
  };
}

export interface DeleteConversationRequest {
  Params: { conversationId: string };
  Headers: {
    profileId: string;
  };
}
