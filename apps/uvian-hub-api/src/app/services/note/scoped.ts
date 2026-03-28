import { ServiceClients } from '../types';
import {
  NoteScopedService,
  Note,
  CreateNoteInput,
  UpdateNoteInput,
} from './types';

export function createNoteScopedService(
  clients: ServiceClients
): NoteScopedService {
  return {
    async getNotesBySpace(
      spaceId: string,
      options: { limit?: number; cursor?: string } = {}
    ): Promise<{ items: Note[]; nextCursor: string | null; hasMore: boolean }> {
      const limit = options.limit || 20;

      let q = clients.userClient
        .schema('core_hub')
        .from('notes')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (options.cursor) {
        q = q.lt('id', options.cursor);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      const hasMore = (data || []).length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      const resolvedItems = (items || []).map((row) => ({
        id: row.id,
        spaceId: row.space_id,
        ownerUserId: row.owner_user_id,
        title: row.title,
        body: row.body,
        attachments: row.attachments || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return {
        items: resolvedItems,
        nextCursor: hasMore ? items[items.length - 1]?.id : null,
        hasMore,
      };
    },

    async getNote(noteId: string): Promise<Note> {
      const { data, error } = await clients.userClient
        .schema('core_hub')
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error || !data) throw new Error('Note not found');

      return {
        id: data.id,
        spaceId: data.space_id,
        ownerUserId: data.owner_user_id,
        title: data.title,
        body: data.body,
        attachments: data.attachments || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },

    async createNote(userId: string, data: CreateNoteInput): Promise<Note> {
      const { data: note, error } = await clients.adminClient
        .schema('core_hub')
        .from('notes')
        .insert({
          id: data.id,
          space_id: data.spaceId,
          owner_user_id: userId,
          title: data.title,
          body: data.body || null,
          attachments: data.attachments || [],
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        id: note.id,
        spaceId: note.space_id,
        ownerUserId: note.owner_user_id,
        title: note.title,
        body: note.body,
        attachments: note.attachments || [],
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      };
    },

    async updateNote(
      userId: string,
      noteId: string,
      data: UpdateNoteInput
    ): Promise<Note> {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.body !== undefined) updateData.body = data.body;
      if (data.attachments !== undefined)
        updateData.attachments = data.attachments;

      const { data: note, error } = await clients.adminClient
        .schema('core_hub')
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        id: note.id,
        spaceId: note.space_id,
        ownerUserId: note.owner_user_id,
        title: note.title,
        body: note.body,
        attachments: note.attachments || [],
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      };
    },

    async deleteNote(
      userId: string,
      noteId: string
    ): Promise<{ success: boolean }> {
      const { data: note, error: fetchError } = await clients.adminClient
        .schema('core_hub')
        .from('notes')
        .select('owner_user_id')
        .eq('id', noteId)
        .single();

      if (fetchError || !note) {
        throw new Error('Note not found');
      }

      if (note.owner_user_id !== userId) {
        throw new Error("Cannot delete another user's note");
      }

      const { error } = await clients.adminClient
        .schema('core_hub')
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw new Error(error.message);

      return { success: true };
    },
  };
}
