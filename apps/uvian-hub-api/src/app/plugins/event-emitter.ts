import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  BaseEventEmitter,
  QueueService,
  Logger,
} from '@org/plugins-event-emitter';
import { queueService } from '../services';
import {
  buildSourcePath,
  MessagingEvents,
  SpaceEvents,
  ContentEvents,
  AccountEvents,
  MessageCreatedData,
  MessageUpdatedData,
  MessageDeletedData,
  ConversationCreatedData,
  ConversationUpdatedData,
  ConversationDeletedData,
  ConversationMemberJoinedData,
  ConversationMemberLeftData,
  SpaceCreatedData,
  SpaceUpdatedData,
  SpaceDeletedData,
  SpaceMemberJoinedData,
  SpaceMemberLeftData,
  SpaceMemberRoleChangedData,
  PostCreatedData,
  PostUpdatedData,
  PostDeletedData,
  NoteCreatedData,
  NoteUpdatedData,
  NoteDeletedData,
  AssetUploadedData,
  AssetDeletedData,
  AccountCreatedData,
  AccountUpdatedData,
  AccountMemberAddedData,
  AccountMemberRemovedData,
  AccountMemberRoleChangedData,
} from '@org/uvian-events';

export class HubEventEmitter extends BaseEventEmitter {
  emitMessageCreated(data: MessageCreatedData, actorId: string): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(MessagingEvents.MESSAGE_CREATED, source, data, actorId);
  }

  emitMessageUpdated(data: MessageUpdatedData, actorId: string): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(MessagingEvents.MESSAGE_UPDATED, source, data, actorId);
  }

  emitMessageDeleted(data: MessageDeletedData, actorId: string): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(MessagingEvents.MESSAGE_DELETED, source, data, actorId);
  }

  emitConversationCreated(
    data: ConversationCreatedData,
    actorId: string
  ): void {
    const source = data.spaceId
      ? buildSourcePath('spaces', data.spaceId)
      : '/conversations';
    this.emit(MessagingEvents.CONVERSATION_CREATED, source, data, actorId);
  }

  emitConversationUpdated(
    data: ConversationUpdatedData,
    actorId: string
  ): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(MessagingEvents.CONVERSATION_UPDATED, source, data, actorId);
  }

  emitConversationDeleted(
    data: ConversationDeletedData,
    actorId: string
  ): void {
    const source = '/conversations';
    this.emit(MessagingEvents.CONVERSATION_DELETED, source, data, actorId);
  }

  emitConversationMemberJoined(
    data: ConversationMemberJoinedData,
    actorId: string
  ): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(
      MessagingEvents.CONVERSATION_MEMBER_JOINED,
      source,
      data,
      actorId
    );
  }

  emitConversationMemberLeft(
    data: ConversationMemberLeftData,
    actorId: string
  ): void {
    const source = buildSourcePath('conversations', data.conversationId);
    this.emit(MessagingEvents.CONVERSATION_MEMBER_LEFT, source, data, actorId);
  }

  emitSpaceCreated(data: SpaceCreatedData, actorId: string): void {
    const source = '/spaces';
    this.emit(SpaceEvents.SPACE_CREATED, source, data, actorId);
  }

  emitSpaceUpdated(data: SpaceUpdatedData, actorId: string): void {
    const source = buildSourcePath('spaces', data.spaceId);
    this.emit(SpaceEvents.SPACE_UPDATED, source, data, actorId);
  }

  emitSpaceDeleted(data: SpaceDeletedData, actorId: string): void {
    const source = '/spaces';
    this.emit(SpaceEvents.SPACE_DELETED, source, data, actorId);
  }

  emitSpaceMemberJoined(data: SpaceMemberJoinedData, actorId: string): void {
    const source = buildSourcePath('spaces', data.spaceId);
    this.emit(SpaceEvents.SPACE_MEMBER_JOINED, source, data, actorId);
  }

  emitSpaceMemberLeft(data: SpaceMemberLeftData, actorId: string): void {
    const source = buildSourcePath('spaces', data.spaceId);
    this.emit(SpaceEvents.SPACE_MEMBER_LEFT, source, data, actorId);
  }

  emitSpaceMemberRoleChanged(
    data: SpaceMemberRoleChangedData,
    actorId: string
  ): void {
    const source = buildSourcePath('spaces', data.spaceId);
    this.emit(SpaceEvents.SPACE_MEMBER_ROLE_CHANGED, source, data, actorId);
  }

  emitPostCreated(data: PostCreatedData, actorId: string): void {
    const source = data.spaceId
      ? buildSourcePath('spaces', data.spaceId)
      : '/content';
    this.emit(ContentEvents.POST_CREATED, source, data, actorId);
  }

  emitPostDeleted(data: PostDeletedData, actorId: string): void {
    const source = '/content';
    this.emit(ContentEvents.POST_DELETED, source, data, actorId);
  }

  emitNoteCreated(data: NoteCreatedData, actorId: string): void {
    const source = '/notes';
    this.emit(ContentEvents.NOTE_CREATED, source, data, actorId);
  }

  emitNoteUpdated(data: NoteUpdatedData, actorId: string): void {
    const source = '/notes';
    this.emit(ContentEvents.NOTE_UPDATED, source, data, actorId);
  }

  emitNoteDeleted(data: NoteDeletedData, actorId: string): void {
    const source = '/notes';
    this.emit(ContentEvents.NOTE_DELETED, source, data, actorId);
  }

  emitAssetUploaded(data: AssetUploadedData, actorId: string): void {
    const source = data.spaceId
      ? buildSourcePath('spaces', data.spaceId)
      : data.conversationId
      ? buildSourcePath('conversations', data.conversationId)
      : '/assets';
    this.emit(ContentEvents.ASSET_UPLOADED, source, data, actorId);
  }

  emitAssetDeleted(data: AssetDeletedData, actorId: string): void {
    const source = '/assets';
    this.emit(ContentEvents.ASSET_DELETED, source, data, actorId);
  }

  emitPostUpdated(data: PostUpdatedData, actorId: string): void {
    const source = '/content';
    this.emit(ContentEvents.POST_UPDATED, source, data, actorId);
  }

  emitAccountCreated(data: AccountCreatedData, actorId: string): void {
    const source = '/accounts';
    this.emit(AccountEvents.ACCOUNT_CREATED, source, data, actorId);
  }

  emitAccountUpdated(data: AccountUpdatedData, actorId: string): void {
    const source = buildSourcePath('accounts', data.accountId);
    this.emit(AccountEvents.ACCOUNT_UPDATED, source, data, actorId);
  }

  emitAccountMemberAdded(data: AccountMemberAddedData, actorId: string): void {
    const source = buildSourcePath('accounts', data.accountId);
    this.emit(AccountEvents.ACCOUNT_MEMBER_ADDED, source, data, actorId);
  }

  emitAccountMemberRemoved(
    data: AccountMemberRemovedData,
    actorId: string
  ): void {
    const source = buildSourcePath('accounts', data.accountId);
    this.emit(AccountEvents.ACCOUNT_MEMBER_REMOVED, source, data, actorId);
  }

  emitAccountMemberRoleChanged(
    data: AccountMemberRoleChangedData,
    actorId: string
  ): void {
    const source = buildSourcePath('accounts', data.accountId);
    this.emit(AccountEvents.ACCOUNT_MEMBER_ROLE_CHANGED, source, data, actorId);
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const log: Logger = {
    info: (obj, msg) => fastify.log.info(obj, msg),
    error: (obj, msg) => fastify.log.error(obj, msg),
  };

  const eventEmitter = new HubEventEmitter({
    queueService: queueService as unknown as QueueService,
    log,
  });
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: HubEventEmitter;
  }
}
