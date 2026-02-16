import { adminSupabase } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Conversation,
  ConversationMembership,
  ConversationMembershipRole,
  CreateMessagePayload,
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
      spaceId?: string;
    }
  ): Promise<Conversation> {
    // 1. App Logic: Verify space access if space_id provided
    if (data.spaceId) {
      const { data: spaceMem } = await userClient
        .from('space_members')
        .select('space_id')
        .eq('space_id', data.spaceId)
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
        space_id: data.spaceId,
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
      spaceId: conversation.space_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  async getConversations(
    userClient: SupabaseClient, 
    profileId: string
  ): Promise<Conversation[]> {
    // Use !inner join to ensure we only get conversations where 
    // the specific profileId is a member
    const { data, error } = await userClient
      .from('conversations')
      .select(`
        *,
        messages(count),
        conversation_members!inner(profile_id)
      `)
      .eq('conversation_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv) => ({
      id: conv.id,
      title: conv.title,
      spaceId: conv.space_id,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: conv.messages?.[0]?.count || 0,
    }));
  }

  async getConversationsInSpace(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<Conversation[]> {
    // Filter by space AND ensure the specific profile is a member
    const { data, error } = await userClient
      .from('conversations')
      .select(`
        *,
        messages(count),
        conversation_members!inner(profile_id)
      `)
      .eq('space_id', spaceId)
      .eq('conversation_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv) => ({
      id: conv.id,
      title: conv.title,
      spaceId: conv.space_id,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: conv.messages?.[0]?.count || 0,
    }));
  }

  async getConversation(
    userClient: SupabaseClient,
    profileId: string,
    id: string
  ): Promise<Conversation | undefined> {
    const { data, error } = await userClient
      .from('conversations')
      .select(`
        *, 
        messages(count),
        conversation_members!inner(profile_id)
      `)
      .eq('id', id)
      .eq('conversation_members.profile_id', profileId)
      .single();

    if (error) return undefined;

    return {
      id: data.id,
      title: data.title,
      spaceId: data.space_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messageCount: data.messages?.[0]?.count || 0,
    };
  }

  async upsertMessage(
    userClient: SupabaseClient,
    conversationId: string,
    data: CreateMessagePayload
  ): Promise<Message> {
    // 1. App Logic: Verify access via Conversation Members
    // We must check if THIS profile is a member, not just if the User owns the chat via another profile.
    const { data: memberCheck } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', data.senderId)
      .single();

    if (!memberCheck) throw new Error('Unauthorized: You are not a member of this chat');

    // 2. Insert via Admin Client
    const { data: message, error } = await adminSupabase
      .from('messages')
      .insert({
        id: data.id,
        conversation_id: conversationId,
        sender_id: data.senderId,
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
      senderId: message.sender_id,
      content: message.content,
      role: message.role,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
    };
  }

  async getMessages(
    userClient: SupabaseClient,
    conversationId: string,
    profileId: string
  ): Promise<Message[]> {
    // 1. Verify access before fetching messages
    const access = await this.getUserRoleInConversation(userClient, conversationId, profileId);
    if (!access) throw new Error('Unauthorized');

    const { data, error } = await userClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
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
      senderId: updated.sender_id,
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

    return (data || []).map((m) => ({
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