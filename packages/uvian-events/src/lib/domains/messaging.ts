import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const MessagingEvents = {
  MESSAGE_CREATED: `${prefix}.conversation.message_created`,
  MESSAGE_UPDATED: `${prefix}.conversation.message_updated`,
  MESSAGE_DELETED: `${prefix}.conversation.message_deleted`,
  CONVERSATION_CREATED: `${prefix}.conversation.conversation_created`,
  CONVERSATION_UPDATED: `${prefix}.conversation.conversation_updated`,
  CONVERSATION_DELETED: `${prefix}.conversation.conversation_deleted`,
  CONVERSATION_MEMBER_JOINED: `${prefix}.conversation.member_joined`,
  CONVERSATION_MEMBER_LEFT: `${prefix}.conversation.member_left`,
  CONVERSATION_MEMBER_ROLE_CHANGED: `${prefix}.conversation.member_role_changed`,
} as const;

export type MessagingEventType =
  (typeof MessagingEvents)[keyof typeof MessagingEvents];

export interface MessageCreatedData {
  messageId: string;
  conversationId: string;
  content: string;
  senderId: string;
  assetIds?: string[];
  threadId?: string;
  parentMessageId?: string;
}

export interface MessageUpdatedData {
  messageId: string;
  conversationId: string;
  content?: string;
  updatedBy: string;
}

export interface MessageDeletedData {
  messageId: string;
  conversationId: string;
  deletedBy: string;
}

export interface ConversationCreatedData {
  conversationId: string;
  spaceId?: string;
  createdBy: string;
  memberIds: string[];
}

export interface ConversationUpdatedData {
  conversationId: string;
  updatedBy: string;
  name?: string;
}

export interface ConversationDeletedData {
  conversationId: string;
  deletedBy: string;
}

export interface ConversationMemberJoinedData {
  conversationId: string;
  userId: string;
  invitedBy?: string;
}

export interface ConversationMemberLeftData {
  conversationId: string;
  userId: string;
  removedBy?: string;
}

export interface ConversationMemberRoleChangedData {
  conversationId: string;
  userId: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}

export type MessagingEventData =
  | MessageCreatedData
  | MessageUpdatedData
  | MessageDeletedData
  | ConversationCreatedData
  | ConversationUpdatedData
  | ConversationDeletedData
  | ConversationMemberJoinedData
  | ConversationMemberLeftData;
