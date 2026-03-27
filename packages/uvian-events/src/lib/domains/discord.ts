import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const DiscordEvents = {
  MESSAGE_CREATED: `${prefix}.discord.message_created`,
  MESSAGE_UPDATED: `${prefix}.discord.message_updated`,
  MESSAGE_DELETED: `${prefix}.discord.message_deleted`,
  INTERACTION_RECEIVED: `${prefix}.discord.interaction_received`,
} as const;

export type DiscordEventType =
  (typeof DiscordEvents)[keyof typeof DiscordEvents];

export interface DiscordMessageCreatedData {
  messageId: string;
  content: string;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId: string;
  guildId?: string;
  isDm: boolean;
}

export interface DiscordMessageUpdatedData {
  messageId: string;
  content: string;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId: string;
}

export interface DiscordMessageDeletedData {
  messageId: string;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId: string;
}

export interface DiscordInteractionData {
  interactionType: number;
  commandName?: string;
  options?: Array<{ name: string; value: string }>;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId?: string;
  guildId?: string;
  isDm: boolean;
}

export type DiscordEventData =
  | DiscordMessageCreatedData
  | DiscordMessageUpdatedData
  | DiscordMessageDeletedData
  | DiscordInteractionData;
