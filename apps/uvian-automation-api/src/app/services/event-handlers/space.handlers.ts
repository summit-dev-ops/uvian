import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  SpaceEvents,
  SpaceMemberJoinedData,
  SpaceMemberRoleChangedData,
  SpaceCreatedData,
} from '@org/uvian-events';

export function registerSpaceHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    SpaceEvents.SPACE_MEMBER_JOINED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as SpaceMemberJoinedData;

      console.log('Space member joined:', {
        spaceId: payload.spaceId,
        userId: payload.userId,
        agentId,
      });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'space.member_joined',
          actor: { id: payload.userId, type: 'user' },
          resource: {
            type: 'space',
            id: payload.spaceId,
            data: { role: payload.role },
          },
          context: { spaceId: payload.spaceId },
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    SpaceEvents.SPACE_MEMBER_ROLE_CHANGED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as SpaceMemberRoleChangedData;

      console.log('Space member role changed:', {
        spaceId: payload.spaceId,
        userId: payload.userId,
        oldRole: payload.oldRole,
        newRole: payload.newRole,
        agentId,
      });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'space.member_role_changed',
          actor: { id: payload.userId, type: 'user' },
          resource: {
            type: 'space',
            id: payload.spaceId,
            data: { oldRole: payload.oldRole, newRole: payload.newRole },
          },
          context: { spaceId: payload.spaceId },
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    SpaceEvents.SPACE_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as SpaceCreatedData;

      console.log('Space created:', {
        spaceId: payload.spaceId,
        name: payload.name,
        agentId,
      });

      await jobService.createEventJob(clients, {
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'space.created',
          actor: { id: payload.createdBy, type: 'user' },
          resource: {
            type: 'space',
            id: payload.spaceId,
            data: { name: payload.name },
          },
          context: { spaceId: payload.spaceId },
          agentId,
        },
      });
    }
  );
}
