import type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
} from './shared/attachment.types';

export type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
};

export interface Conversation {
  id: string;
  title: string;
  resourceScopeId: string;
  spaceId?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export interface ConversationMembership {
  userId: string;
  conversationId: string;
  role: ConversationMembershipRole;
  createdAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export interface ConversationMembershipRole {
  name: 'owner' | 'admin' | 'member';
}

export interface CreateConversationPayload {
  id?: string;
  title: string;
  spaceId?: string;
}

export interface InviteConversationMemberPayload {
  userId: string;
  role?: ConversationMembershipRole;
}

export interface UpdateConversationMemberRolePayload {
  role: ConversationMembershipRole;
}

export interface CreateMessagePayload {
  id: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
  attachments?: Attachment[];
}

export interface CreateConversationRequest {
  Body: CreateConversationPayload;
}

export type GetConversationsRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export interface GetConversationRequest {
  Params: {
    conversationId: string;
  };
}

export interface GetConversationMembersRequest {
  Params: {
    conversationId: string;
  };
}

export interface InviteConversationMemberRequest {
  Params: {
    conversationId: string;
  };
  Body: InviteConversationMemberPayload;
}

export interface DeleteConversationMemberRequest {
  Params: {
    conversationId: string;
    userId: string;
  };
}

export interface UpdateConversationMemberRoleRequest {
  Params: {
    conversationId: string;
    userId: string;
  };
  Body: UpdateConversationMemberRolePayload;
}

export interface CreateMessageRequest {
  Params: {
    conversationId: string;
  };
  Body: CreateMessagePayload;
}

export interface GetMessagesRequest {
  Params: {
    conversationId: string;
  };
}

export interface DeleteConversationRequest {
  Params: {
    conversationId: string;
  };
}

export interface DeleteMessageRequest {
  Params: {
    conversationId: string;
    messageId: string;
  };
}

export interface UpdateMessageRequest {
  Params: {
    conversationId: string;
    messageId: string;
  };
  Body: {
    content: string;
    attachments?: Attachment[];
  };
}
