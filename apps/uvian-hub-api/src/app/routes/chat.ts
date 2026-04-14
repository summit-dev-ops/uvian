import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createConversation,
  deleteConversation,
  createMessage,
  deleteMessage,
  updateMessage,
  inviteConversationMember,
  removeConversationMember,
  updateConversationMemberRole,
} from '../commands/chat';
import { createChatService } from '../services/chat';
import { adminSupabase } from '../clients/supabase.client';

const chatService = createChatService({});
import {
  GetConversationsRequest,
  GetConversationRequest,
  GetConversationMembersRequest,
  CreateConversationRequest,
  InviteConversationMemberRequest,
  DeleteConversationMemberRequest,
  UpdateConversationMemberRoleRequest,
  CreateMessageRequest,
  GetMessagesRequest,
  DeleteConversationRequest,
  DeleteMessageRequest,
  UpdateMessageRequest,
  SearchMessagesRequest,
} from '../types/chat.types';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function (fastify: FastifyInstance) {
  fastify.get<GetConversationsRequest>(
    '/api/conversations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetConversationsRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const conversations = await chatService
          .scoped(getClients(request))
          .getConversations();
        reply.send(conversations);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch conversations' });
      }
    },
  );

  fastify.get<GetConversationRequest>(
    '/api/conversations/:conversationId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetConversationRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { conversationId } = request.params;
        const conversation = await chatService
          .scoped(getClients(request))
          .getConversation(conversationId);
        reply.send(conversation);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Conversation not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch conversation' });
        }
      }
    },
  );

  fastify.get<GetConversationMembersRequest>(
    '/api/conversations/:conversationId/conversation-members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetConversationMembersRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { conversationId } = request.params;
        const members = await chatService
          .scoped(getClients(request))
          .getConversationMembers(conversationId);
        reply.send(members);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch conversation members' });
      }
    },
  );

  fastify.post<CreateConversationRequest>(
    '/api/conversations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string', minLength: 1 },
            spaceId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateConversationRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const result = await createConversation(
          getClients(request),
          {
            userId,
            ...(request.body || {}),
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(201).send(result.conversation);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create conversation' });
      }
    },
  );

  fastify.post<InviteConversationMemberRequest>(
    '/api/conversations/:conversationId/conversation-members/invite',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['owner', 'admin', 'member'] },
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<InviteConversationMemberRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId } = request.params;
        const { userId: targetUserId, role } = request.body || {};
        const result = await inviteConversationMember(
          getClients(request),
          {
            userId,
            conversationId,
            targetUserId,
            role: role || { name: 'member' },
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(201).send(result.member);
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to invite member' });
        } else {
          reply
            .code(400)
            .send({ error: 'Failed to invite conversation member' });
        }
      }
    },
  );

  fastify.delete<DeleteConversationMemberRequest>(
    '/api/conversations/:conversationId/conversation-members/:userId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'userId'],
          properties: {
            conversationId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteConversationMemberRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId, userId: targetUserId } = request.params;
        await removeConversationMember(
          getClients(request),
          {
            userId,
            conversationId,
            targetUserId,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to remove member' });
        } else {
          reply
            .code(400)
            .send({ error: 'Failed to remove conversation member' });
        }
      }
    },
  );

  fastify.patch<UpdateConversationMemberRoleRequest>(
    '/api/conversations/:conversationId/conversation-members/:userId/role',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'userId'],
          properties: {
            conversationId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['owner', 'admin', 'member'] },
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateConversationMemberRoleRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId, userId: targetUserId } = request.params;
        const { role } = request.body || {};
        const result = await updateConversationMemberRole(getClients(request), {
          userId,
          conversationId,
          targetUserId,
          role,
        });
        reply.send(result.member);
      } catch (error: any) {
        if (error.message.includes('permissions')) {
          reply
            .code(403)
            .send({ error: 'Insufficient permissions to update member role' });
        } else {
          reply.code(400).send({ error: 'Failed to update member role' });
        }
      }
    },
  );

  fastify.post<CreateMessageRequest>(
    '/api/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['id', 'content'],
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            role: { type: 'string', enum: ['user', 'assistant', 'system'] },
            attachments: { type: 'array' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateMessageRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId } = request.params;
        const { id, content, role, attachments } = request.body || {};
        const result = await createMessage(
          getClients(request),
          {
            userId,
            conversationId,
            id,
            content,
            role,
            attachments,
          },
          {
            eventEmitter: fastify.services.eventEmitter,
            io: fastify.io as any,
          },
        );

        reply.code(201).send(result.message);
      } catch (error: any) {
        if (error.message.includes('not a member')) {
          reply.code(403).send({ error: 'Not a member of this conversation' });
        } else {
          reply.code(400).send({ error: 'Failed to create message' });
        }
      }
    },
  );

  fastify.get<GetMessagesRequest>(
    '/api/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetMessagesRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { conversationId } = request.params;
        const messages = await chatService
          .scoped(getClients(request))
          .getMessages(conversationId);
        reply.send(messages);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch messages' });
      }
    },
  );

  fastify.get<SearchMessagesRequest>(
    '/api/conversations/:conversationId/messages/search',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string' },
            senderId: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<SearchMessagesRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const { conversationId } = request.params;
        const { q, senderId, from, to, limit, offset } = request.query || {};

        const messages = await chatService
          .scoped(getClients(request))
          .searchMessages(conversationId, {
            q,
            senderId,
            from,
            to,
            limit,
            offset,
          });

        reply.send(messages);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to search messages' });
      }
    },
  );

  fastify.delete<DeleteConversationRequest>(
    '/api/conversations/:conversationId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: { conversationId: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteConversationRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId } = request.params;
        await deleteConversation(
          getClients(request),
          {
            userId,
            conversationId,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('Only owners')) {
          reply
            .code(403)
            .send({ error: 'Only conversation owners can delete' });
        } else {
          reply.code(400).send({ error: 'Failed to delete conversation' });
        }
      }
    },
  );

  fastify.delete<DeleteMessageRequest>(
    '/api/conversations/:conversationId/messages/:messageId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'messageId'],
          properties: {
            conversationId: { type: 'string' },
            messageId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteMessageRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId, messageId } = request.params;
        await deleteMessage(
          getClients(request),
          {
            userId,
            conversationId,
            messageId,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('only your own')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({ error: 'Failed to delete message' });
        }
      }
    },
  );

  fastify.patch<UpdateMessageRequest>(
    '/api/conversations/:conversationId/messages/:messageId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'messageId'],
          properties: {
            conversationId: { type: 'string' },
            messageId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', minLength: 1 },
            attachments: { type: 'array' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateMessageRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }
        const { conversationId, messageId } = request.params;
        const { content, attachments } = request.body || {};
        const result = await updateMessage(
          getClients(request),
          {
            userId,
            conversationId,
            messageId,
            content,
            attachments,
          },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.send(result.message);
      } catch (error: any) {
        if (error.message.includes('only your own')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({ error: 'Failed to update message' });
        }
      }
    },
  );
}
