import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { spacesService } from '../services/spaces.service';
import { adminSupabase } from '../clients/supabase.client';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}
import {
  GetSpacesRequest,
  GetSpaceStatsRequest,
  GetSpaceRequest,
  GetSpaceMembersRequest,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  DeleteSpaceRequest,
  InviteSpaceMemberRequest,
  RemoveSpaceMemberRequest,
  UpdateSpaceMemberRoleRequest,
} from '../types/spaces.types';

export default async function spacesRoutes(fastify: FastifyInstance) {
  fastify.get<GetSpacesRequest>(
    '/api/spaces',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const spaces = await spacesService.getSpaces(getClients(request));
        reply.send(spaces);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch spaces' });
      }
    }
  );

  fastify.get<GetSpaceStatsRequest>(
    '/api/spaces/stats',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const stats = await spacesService.getSpaceStats(
          getClients(request),
          userId
        );
        reply.send(stats);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch space stats' });
      }
    }
  );

  fastify.get<GetSpaceRequest>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: { spaceId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetSpaceRequest>, reply: FastifyReply) => {
      try {
        const { spaceId } = request.params;
        const space = await spacesService.getSpace(
          getClients(request),
          spaceId
        );
        reply.send(space);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Space not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch space' });
        }
      }
    }
  );

  fastify.get<GetSpaceMembersRequest>(
    '/api/spaces/:spaceId/members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: { spaceId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetSpaceMembersRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { spaceId } = request.params;
        const members = await spacesService.getSpaceMembers(
          getClients(request),
          spaceId
        );
        reply.send(members);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch space members' });
      }
    }
  );

  fastify.post<CreateSpaceRequest>(
    '/api/spaces',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            avatarUrl: { type: 'string' },
            coverUrl: { type: 'string' },
            settings: { type: 'object' },
            isPrivate: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateSpaceRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const space = await spacesService.createSpace(
          getClients(request),
          userId,
          request.body || {}
        );
        fastify.services.eventEmitter.emitSpaceCreated(
          {
            spaceId: space.id,
            name: space.name,
            createdBy: userId,
            memberIds: [userId],
          },
          userId
        );
        reply.code(201).send(space);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create space' });
      }
    }
  );

  fastify.patch<UpdateSpaceRequest>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: { spaceId: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            avatarUrl: { type: 'string' },
            coverUrl: { type: 'string' },
            settings: { type: 'object' },
            isPrivate: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateSpaceRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { spaceId } = request.params;
        const space = await spacesService.updateSpace(
          getClients(request),
          userId,
          spaceId,
          request.body || {}
        );
        fastify.services.eventEmitter.emitSpaceUpdated(
          { spaceId, updatedBy: userId, name: space.name },
          userId
        );
        reply.send(space);
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to update space' });
        } else {
          reply.code(400).send({ error: 'Failed to update space' });
        }
      }
    }
  );

  fastify.delete<DeleteSpaceRequest>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: { spaceId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteSpaceRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { spaceId } = request.params;
        await spacesService.deleteSpace(getClients(request), userId, spaceId);
        fastify.services.eventEmitter.emitSpaceDeleted(
          { spaceId, deletedBy: userId },
          userId
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('Only the owner')) {
          reply
            .code(403)
            .send({ error: 'Only the owner can delete this space' });
        } else if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Space not found' });
        } else {
          reply.code(400).send({ error: 'Failed to delete space' });
        }
      }
    }
  );

  fastify.post<InviteSpaceMemberRequest>(
    '/api/spaces/:spaceId/members/invite',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: { spaceId: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['admin', 'member', 'owner'] },
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<InviteSpaceMemberRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { spaceId } = request.params;
        const { userId: targetUserId, role } = request.body || {};
        const membership = await spacesService.inviteMember(
          getClients(request),
          userId,
          spaceId,
          targetUserId,
          role || { name: 'member' }
        );
        fastify.services.eventEmitter.emitSpaceMemberJoined(
          {
            spaceId,
            userId: targetUserId,
            role: (role?.name as 'member' | 'moderator' | 'admin') || 'member',
            invitedBy: userId,
          },
          userId
        );
        reply.code(201).send(membership);
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to invite member' });
        } else {
          reply.code(400).send({ error: 'Failed to invite space member' });
        }
      }
    }
  );

  fastify.delete<RemoveSpaceMemberRequest>(
    '/api/spaces/:spaceId/members/:userId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId', 'userId'],
          properties: {
            spaceId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<RemoveSpaceMemberRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { spaceId, userId: targetUserId } = request.params;
        await spacesService.removeMember(
          getClients(request),
          userId,
          spaceId,
          targetUserId
        );
        fastify.services.eventEmitter.emitSpaceMemberLeft(
          { spaceId, userId: targetUserId, removedBy: userId },
          userId
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to remove member' });
        } else {
          reply.code(400).send({ error: 'Failed to remove space member' });
        }
      }
    }
  );

  fastify.patch<UpdateSpaceMemberRoleRequest>(
    '/api/spaces/:spaceId/members/:userId/role',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId', 'userId'],
          properties: {
            spaceId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['admin', 'member', 'owner'] },
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateSpaceMemberRoleRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { spaceId, userId: targetUserId } = request.params;
        const { role } = request.body || {};
        const membership = await spacesService.updateMemberRole(
          getClients(request),
          userId,
          spaceId,
          targetUserId,
          role
        );
        fastify.services.eventEmitter.emitSpaceMemberRoleChanged(
          {
            spaceId,
            userId: targetUserId,
            oldRole: 'member',
            newRole:
              (role?.name as 'member' | 'moderator' | 'admin') || 'member',
            changedBy: userId,
          },
          userId
        );
        reply.send(membership);
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to update member role' });
        } else {
          reply.code(400).send({ error: 'Failed to update member role' });
        }
      }
    }
  );
}
