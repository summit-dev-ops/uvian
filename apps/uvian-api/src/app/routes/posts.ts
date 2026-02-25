import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postService } from '../services/post.service';
import { profileService } from '../services/profile.service';
import {
  CreatePostRequest,
  GetSpacePostsRequest,
  GetPostRequest,
} from '../types/post.types';

export default async function (fastify: FastifyInstance) {
  fastify.delete<GetPostRequest>(
    '/api/posts/:id',
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
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<GetPostRequest>, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { id } = request.params;

        await postService.deletePost(request.supabase, id, authProfileId);

        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
          reply.code(403).send({ error: error.message });
        } else if (error.message.includes('not found')) {
          reply.code(404).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
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
          properties: {
            spaceId: { type: 'string' },
          },
          required: ['spaceId'],
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
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              spaceId: { type: 'string' },
              profileId: { type: 'string' },
              contentType: { type: 'string' },
              content: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<CreatePostRequest>, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { spaceId } = request.params;
        const { content, contentType } = request.body;

        const post = await postService.createPost(request.supabase, {
          spaceId,
          profileId: authProfileId,
          contentType: contentType || 'text',
          content,
        });

        reply.code(201).send(post);
      } catch (error: any) {
        if (
          error.message.includes('does not have access') ||
          error.message.includes('Unauthorized')
        ) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );

  fastify.get<GetSpacePostsRequest>(
    '/api/spaces/:spaceId/posts',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            spaceId: { type: 'string' },
          },
          required: ['spaceId'],
        },
        querystring: {
          type: 'object',
          properties: {
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
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
                    spaceId: { type: 'string' },
                    profileId: { type: 'string' },
                    contentType: { type: 'string' },
                    content: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
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
    async (
      request: FastifyRequest<GetSpacePostsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { spaceId } = request.params;
        const { cursor, limit } = request.query || {};

        const posts = await postService.getPostsBySpace(
          request.supabase,
          spaceId,
          authProfileId,
          {
            cursor,
            limit: limit || 20,
          }
        );

        const hasMore = posts.length > (limit || 20);
        const items = hasMore ? posts.slice(0, -1) : posts;

        reply.send({
          items,
          nextCursor: hasMore ? posts[posts.length - 1].id : null,
          hasMore,
        });
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
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
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              spaceId: { type: 'string' },
              profileId: { type: 'string' },
              contentType: { type: 'string' },
              content: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<GetPostRequest>, reply: FastifyReply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { id } = request.params;

        const post = await postService.getPost(
          request.supabase,
          id,
          authProfileId
        );

        if (!post) {
          reply.code(404).send({ error: 'Post not found' });
          return;
        }

        reply.send(post);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );
}
