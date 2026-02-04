import { supabase } from './supabase.service';

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
  userId: string;
  conversationId: string;
  role: any;
  createdAt: string;
}

export class ChatService {
  async createConversation(data: {
    id: string;
    title: string;
    userId?: string;
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

    // Create initial admin membership if userId is provided
    if (data.userId) {
      await this.inviteConversationMember(conversation.id, data.userId, {
        name: 'admin',
      });
    }

    return conversation;
  }

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data || [];
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
      content: string;
      role?: 'user' | 'assistant' | 'system';
    }
  ): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        id: data.id,
        conversation_id: conversationId,
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
    userId: string,
    role: any
  ): Promise<Membership> {
    const { data: membership, error } = await supabase
      .from('conversation_members')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to invite member: ${error.message}`);
    }

    return membership;
  }

  async removeConversationMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async updateConversationMemberRole(
    conversationId: string,
    userId: string,
    role: any
  ): Promise<Membership> {
    const { data: membership, error } = await supabase
      .from('conversation_members')
      .update({ role })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return membership;
  }
}

export const chatService = new ChatService();
