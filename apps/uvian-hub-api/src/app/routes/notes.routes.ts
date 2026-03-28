import { FastifyInstance } from 'fastify';
import { createNoteService } from '../services/note';
import { adminSupabase } from '../clients/supabase.client';

const noteService = createNoteService({});
import type { Attachment } from '../types/post.types';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

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

        const result = await noteService
          .scoped(getClients(request))
          .getNotesBySpace(spaceId, { cursor, limit });

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

        const note = await noteService
          .scoped(getClients(request))
          .getNote(noteId);

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

        const note = await noteService
          .scoped(getClients(request))
          .createNote(userId, {
            spaceId,
            title,
            body,
            attachments,
          });

        fastify.services.eventEmitter.emitNoteCreated(
          {
            noteId: note.id,
            title: note.title,
            content: note.body || '',
            createdBy: userId,
          },
          userId
        );

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

        const note = await noteService
          .scoped(getClients(request))
          .updateNote(userId, noteId, { title, body, attachments });

        fastify.services.eventEmitter.emitNoteUpdated(
          { noteId, updatedBy: userId, title, content: body },
          userId
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

        await noteService
          .scoped(getClients(request))
          .deleteNote(userId, noteId);

        fastify.services.eventEmitter.emitNoteDeleted(
          { noteId, deletedBy: userId },
          userId
        );

        reply.send({ success: true });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete note' });
      }
    }
  );
}
