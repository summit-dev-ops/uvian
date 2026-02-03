/**
 * Chat Domain Actions
 *
 * BaseAction implementations for complex business logic.
 * Uses executeMutation to bridge with the API layer.
 */

import type { BaseAction, BaseActionContext } from '~/lib/actions';
import { executeMutation } from '~/lib/api/utils';
import { chatMutations } from '../api';
import type {
  CreateConversationPayload,
  SendMessagePayload,
  DeleteConversationPayload,
  InviteConversationMemberPayload,
  RemoveConversationMemberPayload,
  UpdateConversationMemberRolePayload,
} from '../api';

// ============================================================================
// Actions
// ============================================================================

export const chatActions = {
  /**
   * Send a message in a conversation.
   * Validates content, executes mutation, clears draft, stays on page.
   */
  sendMessage: (
    conversationId: string
  ): BaseAction<SendMessagePayload, Promise<void>> => ({
    id: 'chat.sendMessage',
    group: 'chat',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return !!conversationId && payload.content.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: SendMessagePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        chatMutations.sendMessage(ctx.queryClient, conversationId),
        payload
      );

      // Clear the draft for this conversation in the store
      const state = ctx.store.getState();
      state.clearConversationCache(conversationId);

      // Stay on the conversation page (no navigation)
    },
  }),

  /**
   * Create a new conversation.
   * Creates conversation, navigates to it, sets as active.
   */
  createConversation: (): BaseAction<
    CreateConversationPayload,
    Promise<void>
  > => ({
    id: 'chat.createConversation',
    group: 'chat',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.title.trim().length > 0;
    },

    perform: async (
      ctx: BaseActionContext,
      payload: CreateConversationPayload
    ) => {
      // Execute the mutation
      const newConversation = await executeMutation(
        ctx.queryClient,
        chatMutations.createConversation(ctx.queryClient),
        payload
      );

      // Set as active conversation
      const state = ctx.store.getState();
      if (newConversation) {
        state.setActiveConversation(newConversation.id);
      }

      // Navigate to the new conversation
      ctx.router.push(`/chats/${newConversation.id}`);
    },
  }),

  /**
   * Delete a conversation.
   * Executes delete, navigates away if currently active.
   */
  deleteConversation: (
    conversationId: string
  ): BaseAction<DeleteConversationPayload, Promise<void>> => ({
    id: 'chat.deleteConversation',
    group: 'chat',
    variant: 'destructive',

    canPerform: (ctx, payload) => {
      return !!payload.conversationId;
    },

    perform: async (
      ctx: BaseActionContext,
      payload: DeleteConversationPayload
    ) => {
      // Check if this is the active conversation
      const state = ctx.store.getState();
      const isActive = state.activeConversationId === payload.conversationId;

      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        chatMutations.deleteConversation(ctx.queryClient, conversationId),
        payload
      );

      // If it was active, navigate away
      if (isActive) {
        state.setActiveConversation(null);
        ctx.router.push('/chats');
      }

      // Clear cache for this conversation
      state.clearConversationCache(conversationId);
    },
  }),

  /**
   * Invite a member to a conversation.
   */
  inviteConversationMember: (): BaseAction<
    InviteConversationMemberPayload,
    Promise<void>
  > => ({
    id: 'chat.inviteConversationMember',
    group: 'chat',
    variant: 'info',
    canPerform: (ctx, payload) => !!payload.userId && !!payload.conversationId,
    perform: async (
      ctx: BaseActionContext,
      payload: InviteConversationMemberPayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        chatMutations.inviteConversationMember(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Remove a member from a conversation.
   */
  removeConversationMember: (): BaseAction<
    RemoveConversationMemberPayload,
    Promise<void>
  > => ({
    id: 'chat.removeConversationMember',
    group: 'chat',
    variant: 'destructive',
    canPerform: (ctx, payload) => !!payload.userId && !!payload.conversationId,
    perform: async (
      ctx: BaseActionContext,
      payload: RemoveConversationMemberPayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        chatMutations.removeConversationMember(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Update a member's role.
   */
  updateConversationMemberRole: (): BaseAction<
    UpdateConversationMemberRolePayload,
    Promise<void>
  > => ({
    id: 'chat.updateConversationMemberRole',
    group: 'chat',
    variant: 'info',
    canPerform: (ctx, payload) => !!payload.userId && !!payload.conversationId,
    perform: async (
      ctx: BaseActionContext,
      payload: UpdateConversationMemberRolePayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        chatMutations.updateConversationMemberRole(ctx.queryClient),
        payload
      );
    },
  }),
};
