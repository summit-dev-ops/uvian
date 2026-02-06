import { supabase } from './supabase.service';

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  // Added via frontend merge
  lastMessage?: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    createdAt: string;
  };
  messageCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  profileId: string;
  conversationId: string;
  role: any;
  createdAt: string;
}

export class ChatService {
  async createConversation(data: {
    id: string;
    title: string;
    profileId?: string;
  }): Promise<Conversation> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        id: data.id,
        title: data.title,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    // Create initial admin membership if profileId is provided
    if (data.profileId) {
      await this.inviteConversationMember(conversation.id, data.profileId, {
        name: 'admin',
      });
    }

    return conversation;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      // Return empty array if no profile found (user might not be fully set up)
      return [];
    }

    // First, get the conversation IDs the user is a member of
    const { data: memberships, error: membershipError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('profile_id', profile.id);

    if (membershipError) {
      throw new Error(
        `Failed to fetch user memberships: ${membershipError.message}`
      );
    }

    if (!memberships || memberships.length === 0) {
      return []; // User is not a member of any conversations
    }

    const conversationIds = memberships.map((m) => m.conversation_id);

    // Get conversations using RLS-protected query
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Transform to expected format
    return (data || []).map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return data || undefined;
  }

  async upsertMessage(
    conversationId: string,
    data: {
      id: string;
      sender_id: string;
      content: string;
      role?: 'user' | 'assistant' | 'system';
    }
  ): Promise<Message> {
    const { data: message, error } = await supabase
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

    if (error) {
      throw new Error(`Failed to upsert message: ${error.message}`);
    }

    // Update conversation updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data || [];
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    data: { content: string }
  ): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .update({
        content: data.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return message;
  }

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Membership methods
  async getConversationMembers(conversationId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    return data || [];
  }

  async inviteConversationMember(
    conversationId: string,
    profileId: string,
    role: any
  ): Promise<Membership> {
    const { data: membership, error } = await supabase
      .from('conversation_members')
      .insert({
        profile_id: profileId,
        conversation_id: conversationId,
        role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to invite member: ${error.message}`);
    }

    return {
      profileId: membership.profile_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
    };
  }

  async removeConversationMember(
    conversationId: string,
    profileId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async updateConversationMemberRole(
    conversationId: string,
    profileId: string,
    role: any
  ): Promise<Membership> {
    const { data: membership, error } = await supabase
      .from('conversation_members')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return {
      profileId: membership.profile_id,
      conversationId: membership.conversation_id,
      role: membership.role,
      createdAt: membership.created_at,
    };
  }
}

export const chatService = new ChatService();
