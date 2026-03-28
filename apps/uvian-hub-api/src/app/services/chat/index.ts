import { ServiceClients } from '../types';
import { createChatScopedService } from './scoped';
import { createChatAdminService } from './admin';
import {
  ChatScopedService,
  ChatAdminService,
  CreateChatServiceConfig,
} from './types';

export function createChatService(_config: CreateChatServiceConfig): {
  scoped: (clients: ServiceClients) => ChatScopedService;
  admin: (clients: ServiceClients) => ChatAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createChatScopedService(clients),
    admin: (clients: ServiceClients) => createChatAdminService(clients),
  };
}

export type {
  ChatScopedService,
  ChatAdminService,
  Conversation,
  Message,
  ConversationMembership,
  CreateChatServiceConfig,
} from './types';
