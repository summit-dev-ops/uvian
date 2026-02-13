import { adminSupabase } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Conversation,
  ConversationMembership,
  ConversationMembershipRole,
  Message,
} from '../types/chat.types';

export class ChatService {
  /**
   * Helper: Get user's role in a conversation to check write permissions
   */
  private async getUserRoleInConversation(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string
  ): Promise<ConversationMembershipRole['name'] | null> {
    const { data, error } = await userClient
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId)
      .single();

    if (error || !data) return null;
    return (data.role as ConversationMembershipRole).name;
  }

  async createConversation(
    userClient: SupabaseClient,
    data: {
      id?: string;
      title: string;
      profileId: string; // The profile creating the chat
      space_id?: string;
    }
  ): Promise<Conversation> {
    // 1. App Logic: Verify space access if space_id provided
    if (data.space_id) {
      const { data: spaceMem } = await userClient
        .from('space_members')
        .select('space_id')
        .eq('space_id', data.space_id)
        .eq('profile_id', data.profileId)
        .single();

      if (!spaceMem)
        throw new Error('Unauthorized: You are not a member of this space');
    }

    // 2. Create via Admin Client (RLS is SELECT only)
    const { data: conversation, error } = await adminSupabase
      .from('conversations')
      .insert({
        id: data.id,
        title: data.title,
        space_id: data.space_id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 3. Add creator as 'owner'
    await adminSupabase.from('conversation_members').insert({
      profile_id: data.profileId,
      conversation_id: conversation.id,
      role: { name: 'owner' },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      space_id: conversation.space_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  async getConversations(userClient: SupabaseClient): Promise<Conversation[]> {
    // RLS handles visibility (Space members or Direct members see the rows)
    const { data, error } = await userClient
      .from('conversations')
      .select(
        `
        *,
        messages(count)
      `
      )
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      space_id: conv.space_id,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: conv.messages?.[0]?.count || 0,
    }));
  }

  async getConversationsInSpace(
    userClient: SupabaseClient,
    spaceId: string
  ): Promise<Conversation[]> {
    // RLS ensures the user can only see rows if they are in the space
    const { data, error } = await userClient
      .from('conversations')
      .select('*, messages(count)')
      .eq('space_id', spaceId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      space_id: conv.space_id,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: conv.messages?.[0]?.count || 0,
    }));
  }

  async getConversation(
    userClient: SupabaseClient,
    id: string
  ): Promise<Conversation | undefined> {
    const { data, error } = await userClient
      .from('conversations')
      .select('*, messages(count)')
      .eq('id', id)
      .single();

    if (error) return undefined;

    return {
      id: data.id,
      title: data.title,
      space_id: data.space_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messageCount: data.messages?.[0]?.count || 0,
    };
  }

  async upsertMessage(
    userClient: SupabaseClient,
    conversationId: string,
    data: {
      id?: string;
      sender_id: string;
      content: string;
      role?: 'user' | 'assistant' | 'system';
    }
  ): Promise<Message> {
    // 1. App Logic: Verify access to conversation (RLS check via Select)
    const { data: access } = await userClient
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (!access) throw new Error('Unauthorized or Conversation not found');

    // 2. Insert via Admin Client
    const { data: message, error } = await adminSupabase
      .from('messages')
      .insert({
        id: data.id,
        conversation_id: conversationId,
        sender_id: data.sender_id,
        content: data.content,
        role: data.role || 'user',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 3. Update convo timestamp (Admin Client)
    await adminSupabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return {
      id: message.id,
      conversationId: message.conversation_id,
      content: message.content,
      role: message.role,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    };
  }

  async getMessages(
    userClient: SupabaseClient,
    conversationId: string
  ): Promise<Message[]> {
    const { data, error } = await userClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      content: m.content,
      role: m.role,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  }

  async updateMessage(
    userClient: SupabaseClient,
    conversationId: string,
    messageId: string,
    profileId: string,
    content: string
  ): Promise<Message> {
    // 1. App Logic: Verify sender is original sender OR an admin
    const { data: msg } = await userClient
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    const userRole = await this.getUserRoleInConversation(
      userClient,
      conversationId,
      profileId
    );
    const isOwner = msg?.sender_id === profileId;
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    if (!isOwner && !isAdmin) throw new Error('Unauthorized');

    const { data: updated, error } = await adminSupabase
      .from('messages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: updated.id,
      conversationId: updated.conversation_id,
      content: updated.content,
      role: updated.role,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async deleteConversation(
    userClient: SupabaseClient,
    id: string,
    profileId: string
  ): Promise<void> {
    const role = await this.getUserRoleInConversation(
      userClient,
      id,
      profileId
    );
    if (role !== 'owner')
      throw new Error('Only owners can delete conversations');

    const { error } = await adminSupabase
      .from('conversations')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getConversationMembers(
    userClient: SupabaseClient,
    conversationId: string
  ): Promise<ConversationMembership[]> {
    const { data, error } = await userClient
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) throw new Error(error.message);

    return (data || []).map((m: any) => ({
      profileId: m.profile_id,
      conversationId: m.conversation_id,
      role: m.role,
      createdAt: m.created_at,
    }));
  }

  async inviteConversationMember(
    userClient: SupabaseClient,
    conversationId: string,
    updaterProfileId: string,
    targetProfileId: string,
    role: ConversationMembershipRole
  ): Promise<ConversationMembership> {
    const updaterRole = await this.getUserRoleInConversation(
      userClient,
      conversationId,
      updaterProfileId
    );
    if (updaterRole !== 'admin' && updaterRole !== 'owner') {
      throw new Error('Unauthorized: Insufficient permissions');
    }

    const { data: membership, error } = await adminSupabase
      .from('conversation_members')
      .insert({
        profile_id: targetProfileId,
        conversation_id: conversationId,
        role,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      profileId: membership.profile_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
    };
  }
  async updateConversationMember(
    userClient: SupabaseClient,
    conversationId: string,
    updaterProfileId: string,
    targetProfileId: string,
    role: ConversationMembershipRole
  ): Promise<ConversationMembership> {
    const updaterRole = await this.getUserRoleInConversation(
      userClient,
      conversationId,
      updaterProfileId
    );

    if (updaterRole !== 'admin' && updaterRole !== 'owner') {
      throw new Error('Unauthorized: Insufficient permissions');
    }

    const { data: membership, error } = await adminSupabase
      .from('conversation_members')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('profile_id', targetProfileId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      profileId: membership.profile_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
    };
  }

  async removeConversationMember(
    userClient: SupabaseClient,
    conversationId: string,
    updaterProfileId: string,
    targetProfileId: string
  ): Promise<void> {
    const isSelf = updaterProfileId === targetProfileId;
    const updaterRole = await this.getUserRoleInConversation(
      userClient,
      conversationId,
      updaterProfileId
    );

    if (!isSelf && updaterRole !== 'admin' && updaterRole !== 'owner') {
      throw new Error('Unauthorized');
    }

    const { error } = await adminSupabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('profile_id', targetProfileId);

    if (error) throw new Error(error.message);
  }
}

export const chatService = new ChatService();
