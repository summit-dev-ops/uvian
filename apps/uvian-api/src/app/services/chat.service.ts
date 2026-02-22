import { adminSupabase } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Conversation,
  ConversationMembership,
  ConversationMembershipRole,
  CreateMessagePayload,
  Message,
} from '../types/chat.types';
import { MentionUtil } from '../utils/mention.util';
import { jobService } from './job.service';
import { resourceScopesService } from './resource-scopes.service';
import { queueService } from './queue.service';

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
    data: { id?: string; title: string; profileId: string; spaceId?: string }
  ): Promise<Conversation> {
    // 1. Verify space access (Omitted for brevity...)

    // 2. Create the conversation
    const { data: conversation, error } = await adminSupabase
      .from('conversations')
      .insert({
        id: data.id,
        title: data.title,
        space_id: data.spaceId,
      })
      .select() // Just select the conversation basics
      .single();

    if (error) throw new Error(error.message);

    // 3. Add creator as 'owner'
    await adminSupabase.from('conversation_members').insert({
      profile_id: data.profileId,
      conversation_id: conversation.id,
      role: { name: 'owner' },
    });

    // 4. EXPLICIT FETCH for the scope
    // The trigger has definitely finished by this line.
    const { data: scope, error: scopeError } = await adminSupabase
      .from('resource_scopes')
      .select('id')
      .eq('conversation_id', conversation.id)
      .single();

    if (scopeError || !scope) {
      throw new Error('System Error: Resource Scope was not initialized.');
    }

    return {
      id: conversation.id,
      title: conversation.title,
      spaceId: conversation.space_id,
      resourceScopeId: scope.id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messageCount: 0,
    };
  }

  async getConversations(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<Conversation[]> {
    const { data, error } = await userClient
      .from('conversations')
      .select(
        `
        *,
        messages(count),
        conversation_members!inner(profile_id),
        resource_scopes!conversation_id(id) 
      `
      ) // ^ Join via the conversation_id column in resource_scopes
      .eq('conversation_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      spaceId: conv.space_id,
      // Map the array [ { id } ] to a single string
      resourceScopeId: conv.resource_scopes?.[0]?.id,
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
    const { data, error } = await userClient
      .from('conversations')
      .select(
        `
        *,
        messages(count),
        conversation_members!inner(profile_id),
        resource_scopes!conversation_id(id)
      `
      )
      .eq('space_id', spaceId)
      .eq('conversation_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      spaceId: conv.space_id,
      resourceScopeId: conv.resource_scopes?.[0]?.id,
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
      .select(
        `
        *, 
        messages(count),
        conversation_members!inner(profile_id),
        resource_scopes!conversation_id(id)
      `
      )
      .eq('id', id)
      .eq('conversation_members.profile_id', profileId)
      .single();

    if (error) return undefined;

    return {
      id: data.id,
      title: data.title,
      spaceId: data.space_id,
      resourceScopeId: data.resource_scopes?.[0]?.id,
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
    const { data: memberCheck } = await userClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', data.senderId)
      .single();

    if (!memberCheck)
      throw new Error('Unauthorized: You are not a member of this chat');

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

    await adminSupabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Process mentions asynchronously - don't block message creation
    this.processMessageMentions(message.content, conversationId).catch(
      (error) => {
        console.error('Failed to process mentions:', error);
      }
    );

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

  /**
   * Process mentions in message content and create jobs for agent mentions
   */
  private async processMessageMentions(
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Parse and validate agent mentions
      const agentProfileIds = await MentionUtil.processMentions(messageContent);

      if (!agentProfileIds.length) {
        return; // No agent mentions found
      }

      // Get resource scope for the conversation
      const resourceScope =
        await resourceScopesService.getOrCreateConversationResourceScope(
          adminSupabase,
          conversationId
        );

      // Create jobs for each unique agent mention
      for (const agentProfileId of agentProfileIds) {
        // Check if there's already a queued chat job for this agent in this conversation
        const hasExistingJob = await MentionUtil.hasExistingChatJob(
          conversationId,
          agentProfileId
        );

        if (hasExistingJob) {
          console.log(
            `Skipping job creation - existing job found for agent ${agentProfileId} in conversation ${conversationId}`
          );
          continue;
        }

        // Create chat job for the agent mention
        const jobId = crypto.randomUUID();
        const jobInput = {
          conversationId,
          agentProfileId,
        };

        await jobService.createJob(
          adminSupabase,
          agentProfileId, // Using agent profile ID as the requesting profile
          {
            id: jobId,
            type: 'agent',
            input: jobInput,
            resourceScopeId: resourceScope.id,
          }
        );

        // Add job to BullMQ queue for worker processing
        await queueService.addJob('main-queue', 'chat', {
          jobId: jobId,
        });

        console.log(
          `Created chat job ${jobId} for agent ${agentProfileId} in conversation ${conversationId}`
        );
      }
    } catch (error) {
      console.error('Error processing message mentions:', error);
      // Don't throw - we don't want to fail the entire message creation process
    }
  }
}

export const chatService = new ChatService();
