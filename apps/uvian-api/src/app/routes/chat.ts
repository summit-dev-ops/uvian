import { FastifyInstance } from 'fastify';
import { chatService } from '../services/chat.service';
import {
  CreateConversationRequest,
  InviteConversationMemberRequest,
  UpdateConversationMemberRoleRequest,
  CreateMessageRequest,
  GetConversationRequest,
  GetConversationsRequest,
  GetConversationMembersRequest,
  DeleteConversationMemberRequest,
  GetMessagesRequest,
  DeleteConversationRequest,
} from '../types/chat.types';
import { profileService } from '../services/profile.service';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateConversationRequest>(
    '/api/conversations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['title', 'profileId'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string', minLength: 1 },
            profileId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = request.body;
        const conversation = await chatService.createConversation(
          request.supabase,
          data
        );
        reply.code(201).send(conversation);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get<GetConversationsRequest>(
    '/api/conversations',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const conversations = await chatService.getConversations(
          request.supabase
        );
        reply.send(conversations);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get<GetConversationRequest>(
    '/api/conversations/:conversationId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const conversation = await chatService.getConversation(
          request.supabase,
          conversationId
        );
        if (!conversation) {
          reply.code(404).send({ error: 'Conversation not found' });
          return;
        }
        reply.send(conversation);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get<GetConversationMembersRequest>(
    '/api/conversations/:conversationId/conversation-members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const members = await chatService.getConversationMembers(
          request.supabase,
          conversationId
        );
        reply.send(members);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.post<InviteConversationMemberRequest>(
    '/api/conversations/:conversationId/conversation-members/invite',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['owner', 'admin', 'member'] },
              },
              required: ['name'],
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { conversationId } = request.params;
        const { profileId, role } = request.body;
        const membership = await chatService.inviteConversationMember(
          request.supabase,
          conversationId,
          authProfileId,
          profileId,
          role || { name: 'member' }
        );
        reply.code(201).send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete<DeleteConversationMemberRequest>(
    '/api/conversations/:conversationId/conversation-members/:profileId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'profileId'],
          properties: {
            conversationId: { type: 'string' },
            profileId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { conversationId, profileId: targetProfileId } = request.params;
        await chatService.removeConversationMember(
          request.supabase,
          conversationId,
          authProfileId,
          targetProfileId
        );
        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.patch<UpdateConversationMemberRoleRequest>(
    '/api/conversations/:conversationId/conversation-members/:profileId/role',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId', 'profileId'],
          properties: {
            conversationId: { type: 'string' },
            profileId: { type: 'string' },
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
              required: ['name'],
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { conversationId, profileId: targetProfileId } = request.params;
        const { role } = request.body;
        const membership = await chatService.updateConversationMember(
          request.supabase,
          conversationId,
          authProfileId,
          targetProfileId,
          role
        );
        reply.send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.post<CreateMessageRequest>(
    '/api/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['id', 'senderId', 'content'],
          properties: {
            id: { type: 'string' },
            senderId: { type: 'string' },
            content: { type: 'string' },
            role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const data = request.body;
        const message = await chatService.upsertMessage(
          request.supabase,
          conversationId,
          {
            ...data,
            role: data.role as 'user' | 'assistant' | 'system',
          }
        );

        // Emit socket event to the room
        fastify.io.to(conversationId).emit('new_message', {
          conversationId,
          message,
        });

        reply.code(201).send(message);
      } catch (error: any) {
        if (error.message === 'Unauthorized or Conversation not found') {
          reply.code(404).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );

  fastify.get<GetMessagesRequest>(
    '/api/conversations/:conversationId/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const messages = await chatService.getMessages(
          request.supabase,
          conversationId
        );
        reply.send(messages);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete<DeleteConversationRequest>(
    '/api/conversations/:conversationId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['conversationId'],
          properties: {
            conversationId: { type: 'string' },
          },
          additionalProperties: false,
        },
        headers: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const { conversationId } = request.params;
        await chatService.deleteConversation(
          request.supabase,
          conversationId,
          authProfileId
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message === 'Only owners can delete conversations') {
          reply.code(401).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );
}
