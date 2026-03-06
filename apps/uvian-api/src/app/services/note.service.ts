import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import type { Attachment } from '../types/post.types';

export class NoteService {
  async getNotesBySpace(
    userClient: SupabaseClient,
    spaceId: string,
    options: { limit?: number; cursor?: string } = {}
  ) {
    const limit = options.limit || 20;

    let q = userClient
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
  }

  async getNote(userClient: SupabaseClient, noteId: string) {
    const { data, error } = await userClient
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
  }

  async createNote(
    userClient: SupabaseClient,
    userId: string,
    data: {
      id?: string;
      spaceId: string;
      title: string;
      body?: string;
      attachments?: Attachment[];
    }
  ) {
    const { data: note, error } = await adminSupabase
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
  }

  async updateNote(
    userClient: SupabaseClient,
    userId: string,
    noteId: string,
    data: {
      title?: string;
      body?: string;
      attachments?: Attachment[];
    }
  ) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.attachments !== undefined)
      updateData.attachments = data.attachments;

    const { data: note, error } = await adminSupabase
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
  }

  async deleteNote(userClient: SupabaseClient, userId: string, noteId: string) {
    const { data: note, error: fetchError } = await adminSupabase
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

    const { error } = await adminSupabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw new Error(error.message);

    return { success: true };
  }
}

export const noteService = new NoteService();
