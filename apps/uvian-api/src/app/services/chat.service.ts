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
  role: any; // JSONB mocked as any
  createdAt: string;
}

export class ChatService {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private conversationMembers: Map<string, Membership[]> = new Map();

  async createConversation(data: {
    id: string;
    title: string;
    userId?: string; // Mocking creator
  }): Promise<Conversation> {
    if (this.conversations.has(data.id)) {
      throw new Error('Conversation with this ID already exists');
    }

    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: data.id,
      title: data.title,
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);

    // Create initial admin membership if userId is provided
    if (data.userId) {
      await this.inviteConversationMember(conversation.id, data.userId, {
        name: 'admin',
      });
    }

    return conversation;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async upsertMessage(
    conversationId: string,
    data: {
      id: string;
      content: string;
      role?: 'user' | 'assistant' | 'system';
    }
  ): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    let conversationMessages = this.messages.get(conversationId) || [];
    const existingIndex = conversationMessages.findIndex(
      (m) => m.id === data.id
    );
    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      // Update existing
      const updatedMessage: Message = {
        ...conversationMessages[existingIndex],
        content: data.content,
        updatedAt: now,
      };
      conversationMessages[existingIndex] = updatedMessage;
    } else {
      // Create new
      const message: Message = {
        id: data.id,
        conversationId: conversationId,
        content: data.content,
        role: data.role || 'user',
        createdAt: now,
        updatedAt: now,
      };
      conversationMessages.push(message);
    }

    this.messages.set(conversationId, conversationMessages);

    // Update conversation updatedAt
    conversation.updatedAt = now;
    this.conversations.set(conversationId, conversation);

    return existingIndex !== -1
      ? conversationMessages[existingIndex]
      : conversationMessages[conversationMessages.length - 1];
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messages.get(conversationId) || [];
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    data: { content: string }
  ): Promise<Message> {
    const messages = this.messages.get(conversationId) || [];
    const messageIndex = messages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    const now = new Date().toISOString();
    const updatedMessage: Message = {
      ...messages[messageIndex],
      content: data.content,
      updatedAt: now,
    };

    messages[messageIndex] = updatedMessage;
    this.messages.set(conversationId, messages);

    // Also update conversation updatedAt
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.updatedAt = now;
      this.conversations.set(conversationId, conversation);
    }

    return updatedMessage;
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    this.messages.delete(id);
    this.conversationMembers.delete(id);
  }

  // Membership methods
  async getConversationMembers(conversationId: string): Promise<Membership[]> {
    return this.conversationMembers.get(conversationId) || [];
  }

  async inviteConversationMember(
    conversationId: string,
    userId: string,
    role: any
  ): Promise<Membership> {
    const members = this.conversationMembers.get(conversationId) || [];
    const existing = members.find((m) => m.userId === userId);

    if (existing) {
      throw new Error('User is already a member of this conversation');
    }

    const membership: Membership = {
      userId,
      conversationId,
      role,
      createdAt: new Date().toISOString(),
    };

    members.push(membership);
    this.conversationMembers.set(conversationId, members);
    return membership;
  }

  async removeConversationMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const members = this.conversationMembers.get(conversationId) || [];
    const newMembers = members.filter((m) => m.userId !== userId);

    if (members.length === newMembers.length) {
      throw new Error('Member not found');
    }

    this.conversationMembers.set(conversationId, newMembers);
  }

  async updateConversationMemberRole(
    conversationId: string,
    userId: string,
    role: any
  ): Promise<Membership> {
    const members = this.conversationMembers.get(conversationId) || [];
    const memberIndex = members.findIndex((m) => m.userId === userId);

    if (memberIndex === -1) {
      throw new Error('Member not found');
    }

    members[memberIndex].role = role;
    this.conversationMembers.set(conversationId, members);
    return members[memberIndex];
  }
}

export const chatService = new ChatService();
