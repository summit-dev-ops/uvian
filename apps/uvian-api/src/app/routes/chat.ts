import { FastifyInstance } from 'fastify';
import { chatService } from '../services/chat.service';

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/conversations', async (request, reply) => {
    const data = request.body as {
      id: string;
      title: string;
      profileId?: string;
    };
    try {
      const conversation = await chatService.createConversation(data);
      reply.code(201).send(conversation);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  fastify.get('/api/conversations', async (request, reply) => {
    const conversations = await chatService.getConversations();
    reply.send(conversations);
  });

  fastify.get('/api/conversations/:conversationId', async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const conversation = await chatService.getConversation(conversationId);
    if (!conversation) {
      reply.code(404).send({ error: 'Conversation not found' });
      return;
    }
    reply.send(conversation);
  });

  fastify.get(
    '/api/conversations/:conversationId/conversation-members',
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const members = await chatService.getConversationMembers(conversationId);
      reply.send(members);
    }
  );

  fastify.post(
    '/api/conversations/:conversationId/conversation-members/invite',
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const { profileId, role } = request.body as {
        profileId: string;
        role: any;
      };
      try {
        const membership = await chatService.inviteConversationMember(
          conversationId,
          profileId,
          role
        );
        reply.code(201).send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.delete(
    '/api/conversations/:conversationId/conversation-members/:profileId',
    async (request, reply) => {
      const { conversationId, profileId } = request.params as {
        conversationId: string;
        profileId: string;
      };
      try {
        await chatService.removeConversationMember(conversationId, profileId);
        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.patch(
    '/api/conversations/:conversationId/conversation-members/:profileId/role',
    async (request, reply) => {
      const { conversationId, profileId } = request.params as {
        conversationId: string;
        profileId: string;
      };
      const { role } = request.body as { role: any };
      try {
        const membership = await chatService.updateConversationMemberRole(
          conversationId,
          profileId,
          role
        );
        reply.send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/api/conversations/:conversationId/messages',
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const data = request.body as {
        id: string;
        sender_id: string;
        content: string;
        role?: string;
      };
      try {
        const message = await chatService.upsertMessage(conversationId, {
          ...data,
          role: data.role as 'user' | 'assistant' | 'system',
        });

        // Emit socket event to the room
        fastify.io.to(conversationId).emit('new_message', {
          conversationId,
          message,
        });

        reply.code(201).send(message);
      } catch (error: any) {
        if (error.message === 'Conversation not found') {
          reply.code(404).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );

  fastify.get(
    '/api/conversations/:conversationId/messages',
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      const messages = await chatService.getMessages(conversationId);
      reply.send(messages);
    }
  );

  fastify.delete(
    '/api/conversations/:conversationId',
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string };
      await chatService.deleteConversation(conversationId);
      reply.code(204).send();
    }
  );
}
