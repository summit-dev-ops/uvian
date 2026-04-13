import { Conversation, Message } from '../../services/chat/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';
import type { Server as SocketIOServer } from 'socket.io';

export interface CreateConversationCommandInput {
  userId: string;
  title: string;
  spaceId?: string;
}

export interface CreateConversationCommandOutput {
  conversation: Conversation;
}

export interface DeleteConversationCommandInput {
  userId: string;
  conversationId: string;
}

export interface DeleteConversationCommandOutput {
  success: boolean;
}

export interface CreateMessageCommandInput {
  userId: string;
  conversationId: string;
  id: string;
  content: string;
  role?: string;
  attachments?: unknown[];
}

export interface CreateMessageCommandOutput {
  message: Message;
}

export interface DeleteMessageCommandInput {
  userId: string;
  conversationId: string;
  messageId: string;
}

export interface DeleteMessageCommandOutput {
  success: boolean;
}

export interface UpdateMessageCommandInput {
  userId: string;
  conversationId: string;
  messageId: string;
  content: string;
  attachments?: unknown[];
}

export interface UpdateMessageCommandOutput {
  message: Message;
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
  io?: SocketIOServer;
}
