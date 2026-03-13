import { queueService } from '../queue.service';
import {
  WebhookEnvelope,
  SpaceEvents,
  SpaceMemberJoinedData,
  SpaceMemberRoleChangedData,
  SpaceCreatedData,
} from '@org/uvian-events';

export function registerSpaceHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    SpaceEvents.SPACE_MEMBER_JOINED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as SpaceMemberJoinedData;

      console.log('Space member joined:', {
        spaceId: payload.spaceId,
        userId: payload.userId,
      });

      await queueService.addJob('main-queue', 'space.member_joined', {
        eventId: envelope.id,
        spaceId: payload.spaceId,
        userId: payload.userId,
        role: payload.role,
      });
    }
  );

  webhookHandler.registerHandler(
    SpaceEvents.SPACE_MEMBER_ROLE_CHANGED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as SpaceMemberRoleChangedData;

      console.log('Space member role changed:', {
        spaceId: payload.spaceId,
        userId: payload.userId,
        oldRole: payload.oldRole,
        newRole: payload.newRole,
      });

      await queueService.addJob('main-queue', 'space.member_role_changed', {
        eventId: envelope.id,
        spaceId: payload.spaceId,
        userId: payload.userId,
        oldRole: payload.oldRole,
        newRole: payload.newRole,
      });
    }
  );

  webhookHandler.registerHandler(
    SpaceEvents.SPACE_CREATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as SpaceCreatedData;

      console.log('Space created:', {
        spaceId: payload.spaceId,
        name: payload.name,
      });

      await queueService.addJob('main-queue', 'space.created', {
        eventId: envelope.id,
        spaceId: payload.spaceId,
        createdBy: payload.createdBy,
        name: payload.name,
      });
    }
  );
}
