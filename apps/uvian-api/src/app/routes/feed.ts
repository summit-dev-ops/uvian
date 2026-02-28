import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { feedService } from '../services/feed.service';
import { profileService } from '../services/profile.service';
import {
  GetFeedRequest,
  MarkReadRequest,
  MarkAllReadRequest,
} from '../types/feed.types';

export default async function (fastify: FastifyInstance) {
  fastify.get<GetFeedRequest>(
    '/api/feed',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['post', 'message', 'job', 'ticket'],
            },
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            spaceId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    profileId: { type: 'string' },
                    type: { type: 'string' },
                    eventType: { type: 'string' },
                    sourceId: { type: 'string' },
                    sourceType: { type: 'string' },
                    readAt: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    actorId: { type: ['string', 'null'] },
                    actorDisplayName: { type: ['string', 'null'] },
                    actorAvatarUrl: { type: ['string', 'null'] },
                    payload: { type: 'object' },
                  },
                },
              },
              nextCursor: { type: ['string', 'null'] },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<GetFeedRequest>, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { type, cursor, limit, spaceId } = request.query || {};

        const result = await feedService.getFeed(
          request.supabase,
          authProfileId,
          {
            type,
            cursor,
            limit: limit || 20,
            spaceId,
          }
        );

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch feed' });
      }
    }
  );

  fastify.get(
    '/api/feed/unread-count',
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              byType: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const result = await feedService.getUnreadCounts(
          request.supabase,
          authProfileId
        );

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch unread count' });
      }
    }
  );

  fastify.patch<MarkReadRequest>(
    '/api/feed/:id/read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          204: { type: 'null' },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<MarkReadRequest>, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { id } = request.params;

        await feedService.markAsRead(request.supabase, authProfileId, id);

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to mark feed item as read' });
      }
    }
  );

  fastify.post<MarkAllReadRequest>(
    '/api/feed/read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['post', 'message', 'job', 'ticket'],
            },
            beforeItemId: { type: 'string' },
          },
        },
        response: {
          204: { type: 'null' },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<MarkAllReadRequest>,
      reply: FastifyReply
    ) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { type, beforeItemId } = request.body || {};

        await feedService.markAllAsRead(request.supabase, authProfileId, {
          type,
          beforeItemId,
        });

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to mark feed items as read' });
      }
    }
  );
}
