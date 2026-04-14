import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createPost, deletePost } from '../commands/post';
import { createPostService } from '../services/post';
import { adminSupabase } from '../clients/supabase.client';
import {
  GetSpacePostsRequest,
  GetPostRequest,
  CreatePostRequest,
  DeletePostRequest,
} from '../types/post.types';

const postService = createPostService({});

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function (fastify: FastifyInstance) {
  fastify.get<GetSpacePostsRequest>(
    '/api/spaces/:spaceId/posts',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { spaceId: { type: 'string' } },
          required: ['spaceId'],
          additionalProperties: false,
        },
        querystring: {
          type: 'object',
          properties: {
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetSpacePostsRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { spaceId } = request.params;
        const { cursor, limit } = request.query || {};

        const result = await postService
          .scoped(getClients(request))
          .getPostsBySpace(spaceId, { cursor, limit });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch posts' });
      }
    },
  );

  fastify.get<GetPostRequest>(
    '/api/posts/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetPostRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const post = await postService.scoped(getClients(request)).getPost(id);

        reply.send(post);
      } catch (error: any) {
        if (error.message === 'Post not found') {
          reply.code(404).send({ error: 'Post not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch post' });
        }
      }
    },
  );

  fastify.post<CreatePostRequest>(
    '/api/spaces/:spaceId/posts',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { spaceId: { type: 'string' } },
          required: ['spaceId'],
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['contents'],
          properties: {
            id: { type: 'string' },
            contents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['note', 'asset', 'external'] },
                  note: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', minLength: 1 },
                      body: { type: 'string' },
                      attachments: { type: 'array' },
                    },
                    required: ['title'],
                  },
                  noteId: { type: 'string' },
                  assetId: { type: 'string' },
                  url: { type: 'string' },
                },
                required: ['type'],
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<CreatePostRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { spaceId } = request.params;
        const body = request.body as
          | {
              id?: string;
              contents: Array<{
                type: 'note' | 'asset' | 'external';
                note?: { title: string; body?: string; attachments?: any[] };
                noteId?: string;
                assetId?: string;
                url?: string;
              }>;
            }
          | undefined;

        const { id, contents } = body || {};

        if (!contents || contents.length === 0) {
          reply
            .code(400)
            .send({ error: 'Post must have at least one content item' });
          return;
        }

        const result = await createPost(
          getClients(request),
          {
            id,
            spaceId,
            userId,
            contents,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );

        reply.code(201).send(result.post);
      } catch (error: any) {
        if (error.message.includes('Not a member')) {
          reply.code(403).send({ error: 'Not a member of this space' });
        } else {
          reply.code(400).send({ error: 'Failed to create post' });
        }
      }
    },
  );

  fastify.delete<DeletePostRequest>(
    '/api/posts/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<DeletePostRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;

        await deletePost(
          getClients(request),
          {
            postId: id,
            userId,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );

        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('another user')) {
          reply.code(403).send({ error: "Cannot delete another user's post" });
        } else if (error.message === 'Post not found') {
          reply.code(404).send({ error: 'Post not found' });
        } else {
          reply.code(400).send({ error: 'Failed to delete post' });
        }
      }
    },
  );
}
