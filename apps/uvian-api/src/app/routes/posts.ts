import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postService } from '../services/post.service';
import {
  GetSpacePostsRequest,
  GetPostRequest,
  CreatePostRequest,
  DeletePostRequest,
} from '../types/post.types';

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
      reply: FastifyReply
    ) => {
      try {
        const { spaceId } = request.params;
        const { cursor, limit } = request.query || {};

        const result = await postService.getPostsBySpace(
          request.supabase,
          spaceId,
          { cursor, limit }
        );

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch posts' });
      }
    }
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

        const post = await postService.getPost(request.supabase, id);

        reply.send(post);
      } catch (error: any) {
        if (error.message === 'Post not found') {
          reply.code(404).send({ error: 'Post not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch post' });
        }
      }
    }
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
          required: ['content'],
          properties: {
            content: { type: 'string', minLength: 1 },
            contentType: {
              type: 'string',
              enum: ['text', 'url'],
              default: 'text',
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
        const { content, contentType } = request.body || {};

        const post = await postService.createPost(request.supabase, {
          spaceId,
          userId,
          content,
          contentType: contentType || 'text',
        });

        reply.code(201).send(post);
      } catch (error: any) {
        if (error.message.includes('Not a member')) {
          reply.code(403).send({ error: 'Not a member of this space' });
        } else {
          reply.code(400).send({ error: 'Failed to create post' });
        }
      }
    }
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

        await postService.deletePost(request.supabase, id, userId);

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
    }
  );
}
