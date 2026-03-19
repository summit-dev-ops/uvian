import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';
import type { Attachment } from '../types/chat.types';

export class ChatService {
  async getConversations(userClient: SupabaseClient) {
    const { data, error } = await userClient
      .from('get_conversations_for_current_user')
      .select('*');

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      spaceId: row.space_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: 'synced',
      lastMessage: row.last_message,
    }));
  }

  async getConversation(userClient: SupabaseClient, conversationId: string) {
    console.log('getConversation');
    const { data, error } = await userClient
      .from('get_conversation_details')
      .select('*')
      .eq('id', conversationId)
      .single();

    console.log('getConversation', error);
    if (error || !data) {
      throw new Error('Conversation not found');
    }
    return data;
  }

  async getConversationMembers(
    userClient: SupabaseClient,
    conversationId: string
  ) {
    const { data, error } = await userClient
      .from('get_conversation_members')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      userId: row.user_id,
      conversationId: row.conversation_id,
      role: row.role,
      createdAt: row.joined_at,
      syncStatus: 'synced' as const,
    }));
  }

  async getMessages(userClient: SupabaseClient, conversationId: string) {
    const { data, error } = await userClient
      .from('get_conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) throw new Error(error.message);

    const messages = (data || []).map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attachments: row.attachments || [],
      syncStatus: 'synced' as const,
    }));

    return messages;
  }

  async searchMessages(
    userClient: SupabaseClient,
    conversationId: string,
    options: {
      q?: string;
      senderId?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = userClient
      .from('get_conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (options.q) {
      query = query.ilike('content', `%${options.q}%`);
    }
    if (options.senderId) {
      query = query.eq('sender_id', options.senderId);
    }
    if (options.from) {
      query = query.gte('created_at', options.from);
    }
    if (options.to) {
      query = query.lte('created_at', options.to);
    }

    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const messages = (data || []).map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attachments: row.attachments || [],
      syncStatus: 'synced' as const,
    }));

    return messages;
  }

  async createConversation(
    userId: string,
    data: { id?: string; title: string; spaceId?: string }
  ) {
    const { data: conversation, error: convError } = await adminSupabase
      .from('conversations')
      .insert({
        id: data.id,
        title: data.title,
        space_id: data.spaceId,
      })
      .select()
      .single();

    if (convError) throw new Error(convError.message);

    await adminSupabase.from('conversation_members').insert({
      user_id: userId,
      conversation_id: conversation.id,
      role: { name: 'owner' },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      spaceId: conversation.space_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  async createMessage(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    data: {
      id: string;
      content: string;
      role?: string;
      attachments?: Attachment[];
    }
  ) {
    // Check membership
    const { data: memberCheck } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();
    if (!memberCheck) {
      throw new Error('You are not a member of this conversation');
    }

    // Store attachments directly (URLs are already public/permanent)
    const { data: message, error } = await adminSupabase
      .from('messages')
      .insert({
        id: data.id,
        conversation_id: conversationId,
        sender_id: userId,
        content: data.content,
        role: data.role || 'user',
        attachments: data.attachments || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await adminSupabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      role: message.role,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      attachments: message.attachments || [],
      syncStatus: 'synced' as const,
    };
  }

  async inviteMember(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    targetUserId: string,
    role: { name: string }
  ) {
    // Check inviter role
    const { data: updaterMembership } = await userClient
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    const updaterRole = updaterMembership?.role?.name;
    if (updaterRole !== 'admin' && updaterRole !== 'owner') {
      throw new Error('Insufficient permissions');
    }

    const { data: membership, error } = await adminSupabase
      .from('conversation_members')
      .insert({
        user_id: targetUserId,
        conversation_id: conversationId,
        role: role || { name: 'member' },
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      userId: membership.user_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
      syncStatus: 'synced' as const,
    };
  }

  async removeMember(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    targetUserId: string
  ) {
    const isSelf = userId === targetUserId;

    const { data: removerMembership } = await userClient
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    const removerRole = removerMembership?.role?.name;

    if (!isSelf && removerRole !== 'admin' && removerRole !== 'owner') {
      throw new Error('Insufficient permissions');
    }

    const { error } = await adminSupabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', targetUserId);

    if (error) throw new Error(error.message);

    return { success: true };
  }

  async updateMemberRole(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    targetUserId: string,
    role: { name: string }
  ) {
    const { data: updaterMembership } = await userClient
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    const updaterRole = updaterMembership?.role?.name;
    if (updaterRole !== 'admin' && updaterRole !== 'owner') {
      throw new Error('Insufficient permissions');
    }

    const { data: membership, error } = await adminSupabase
      .from('conversation_members')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      userId: membership.user_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
      syncStatus: 'synced' as const,
    };
  }

  async deleteConversation(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string
  ) {
    const { data: membership } = await userClient
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    const role = membership?.role?.name;
    if (role !== 'owner') {
      throw new Error('Only owners can delete conversations');
    }

    const { error } = await adminSupabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw new Error(error.message);

    return { success: true };
  }

  async deleteMessage(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    messageId: string
  ) {
    // Check membership
    const { data: memberCheck } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();
    if (!memberCheck) {
      throw new Error('You are not a member of this conversation');
    }

    const { data: message, error: fetchError } = await adminSupabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .single();

    if (fetchError || !message) {
      throw new Error('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new Error('You can only delete your own messages');
    }

    const { error } = await adminSupabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('conversation_id', conversationId);

    if (error) throw new Error(error.message);

    return { success: true };
  }

  async updateMessage(
    userClient: SupabaseClient,
    userId: string,
    conversationId: string,
    messageId: string,
    content: string,
    attachments?: Attachment[]
  ) {
    // Check membership
    const { data: memberCheck } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();
    if (!memberCheck) {
      throw new Error('You are not a member of this conversation');
    }

    const { data: message, error: fetchError } = await adminSupabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .single();

    if (fetchError || !message) {
      throw new Error('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new Error('You can only edit your own messages');
    }

    const { data: updatedMessage, error } = await adminSupabase
      .from('messages')
      .update({
        content,
        attachments: attachments ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: updatedMessage.id,
      conversationId: updatedMessage.conversation_id,
      senderId: updatedMessage.sender_id,
      content: updatedMessage.content,
      role: updatedMessage.role,
      createdAt: updatedMessage.created_at,
      updatedAt: updatedMessage.updated_at,
      attachments: updatedMessage.attachments || [],
      syncStatus: 'synced' as const,
    };
  }
}

export const chatService = new ChatService();
