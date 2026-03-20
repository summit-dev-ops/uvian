import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postService } from '../services/post.service';
import { noteService } from '../services/note.service';
import { adminSupabase } from '../clients/supabase.client';
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

        // Create the post first
        const { data: post, error: postError } = await adminSupabase
          .schema('core_hub')
          .from('posts')
          .insert({
            id,
            space_id: spaceId,
            author_id: userId,
          })
          .select()
          .single();

        if (postError || !post) {
          throw new Error(postError?.message || 'Failed to create post');
        }

        // Process each content item
        for (let i = 0; i < contents.length; i++) {
          const item = contents[i];

          if (item.type === 'note') {
            let noteId = item.noteId;

            // Create note if provided
            if (item.note?.title) {
              const createdNote = await noteService.createNote(
                request.supabase,
                userId,
                {
                  id: item.noteId,
                  spaceId,
                  title: item.note.title,
                  body: item.note.body,
                  attachments: item.note.attachments,
                }
              );
              noteId = createdNote.id;
            }

            // Insert into post_contents
            await adminSupabase
              .schema('core_hub')
              .from('post_contents')
              .insert({
                post_id: post.id,
                content_type: 'note',
                note_id: noteId,
                position: i,
              });
          } else if (item.type === 'asset') {
            await adminSupabase
              .schema('core_hub')
              .from('post_contents')
              .insert({
                post_id: post.id,
                content_type: 'asset',
                asset_id: item.assetId,
                position: i,
              });
          } else if (item.type === 'external') {
            await adminSupabase
              .schema('core_hub')
              .from('post_contents')
              .insert({
                post_id: post.id,
                content_type: 'external',
                url: item.url,
                position: i,
              });
          }
        }

        // Fetch the complete post with contents
        const fullPost = await postService.getPost(request.supabase, post.id);

        fastify.services.eventEmitter.emitPostCreated(
          {
            postId: post.id,
            content: JSON.stringify(contents),
            authorId: userId,
            spaceId,
          },
          userId
        );

        reply.code(201).send(fullPost);
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

        fastify.services.eventEmitter.emitPostDeleted(
          { postId: id, deletedBy: userId },
          userId
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
    }
  );
}
