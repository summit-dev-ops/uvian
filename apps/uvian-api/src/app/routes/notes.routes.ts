import { FastifyInstance } from 'fastify';
import { noteService } from '../services/note.service';
import type { Attachment } from '../types/post.types';

interface GetSpaceNotesParams {
  spaceId: string;
}

interface GetNoteParams {
  spaceId: string;
  noteId: string;
}

interface CreateNoteBody {
  title: string;
  body?: string;
  attachments?: Attachment[];
}

interface UpdateNoteBody {
  title?: string;
  body?: string;
  attachments?: Attachment[];
}

export default async function (fastify: FastifyInstance) {
  fastify.get<{
    Params: GetSpaceNotesParams;
    Querystring: { cursor?: string; limit?: number };
  }>(
    '/api/spaces/:spaceId/notes',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { spaceId } = request.params;
        const { cursor, limit } = request.query || {};

        const result = await noteService.getNotesBySpace(
          request.supabase,
          spaceId,
          { cursor, limit }
        );

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch notes' });
      }
    }
  );

  fastify.get<{ Params: GetNoteParams }>(
    '/api/spaces/:spaceId/notes/:noteId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { noteId } = request.params;

        const note = await noteService.getNote(request.supabase, noteId);

        reply.send(note);
      } catch (error: any) {
        if (error.message === 'Note not found') {
          reply.code(404).send({ error: 'Note not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch note' });
        }
      }
    }
  );

  fastify.post<{ Params: GetSpaceNotesParams; Body: CreateNoteBody }>(
    '/api/spaces/:spaceId/notes',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { spaceId } = request.params;
        const { title, body, attachments } = request.body || {};

        const note = await noteService.createNote(request.supabase, userId, {
          spaceId,
          title,
          body,
          attachments,
        });

        reply.code(201).send(note);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create note' });
      }
    }
  );

  fastify.patch<{ Params: GetNoteParams; Body: UpdateNoteBody }>(
    '/api/spaces/:spaceId/notes/:noteId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { noteId } = request.params;
        const { title, body, attachments } = request.body || {};

        const note = await noteService.updateNote(
          request.supabase,
          userId,
          noteId,
          { title, body, attachments }
        );

        reply.send(note);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update note' });
      }
    }
  );

  fastify.delete<{ Params: GetNoteParams }>(
    '/api/spaces/:spaceId/notes/:noteId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { noteId } = request.params;

        await noteService.deleteNote(request.supabase, userId, noteId);

        reply.send({ success: true });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete note' });
      }
    }
  );
}
