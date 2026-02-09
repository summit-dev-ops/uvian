import { FastifyInstance } from 'fastify';
import { spacesService } from '../services/spaces.service';
import { chatService } from '../services/chat.service';

export default async function spacesRoutes(fastify: FastifyInstance) {
  // Create a new space
  fastify.post('/api/spaces', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const data = request.body as {
      name: string;
      description?: string;
      avatar_url?: string;
      settings?: Record<string, any>;
      is_private?: boolean;
    };

    try {
      const space = await spacesService.createSpace(userId, data);
      reply.code(201).send(space);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get user's spaces
  fastify.get('/api/spaces', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const spaces = await spacesService.getSpaces(userId);
      reply.send(spaces);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get space stats
  fastify.get('/api/spaces/stats', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const stats = await spacesService.getSpaceStats(userId);
      reply.send(stats);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get specific space
  fastify.get('/api/spaces/:spaceId', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };

    try {
      const space = await spacesService.getSpace(spaceId, userId);
      if (!space) {
        reply.code(404).send({ error: 'Space not found' });
        return;
      }
      reply.send(space);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Update space
  fastify.patch('/api/spaces/:spaceId', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };
    const data = request.body as {
      name?: string;
      description?: string;
      avatar_url?: string;
      settings?: Record<string, any>;
      is_private?: boolean;
    };

    try {
      const space = await spacesService.updateSpace(spaceId, userId, data);
      reply.send(space);
    } catch (error: any) {
      if (error.message === 'User profile not found') {
        reply.code(401).send({ error: error.message });
      } else {
        reply.code(400).send({ error: error.message });
      }
    }
  });

  // Delete space
  fastify.delete('/api/spaces/:spaceId', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };

    try {
      await spacesService.deleteSpace(spaceId, userId);
      reply.code(204).send();
    } catch (error: any) {
      if (error.message === 'User profile not found') {
        reply.code(401).send({ error: error.message });
      } else {
        reply.code(400).send({ error: error.message });
      }
    }
  });

  // Get space members
  fastify.get('/api/spaces/:spaceId/members', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };

    try {
      const members = await spacesService.getSpaceMembers(spaceId);
      reply.send(members);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Invite space member
  fastify.post(
    '/api/spaces/:spaceId/members/invite',
    async (request, reply) => {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { spaceId } = request.params as { spaceId: string };
      const { profile_id, role } = request.body as {
        profile_id: string;
        role?: any;
      };

      try {
        const membership = await spacesService.inviteSpaceMember(
          spaceId,
          profile_id,
          role || { name: 'member' },
        );
        reply.code(201).send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    },
  );

  // Remove space member
  fastify.delete(
    '/api/spaces/:spaceId/members/:profileId',
    async (request, reply) => {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { spaceId, profileId } = request.params as {
        spaceId: string;
        profileId: string;
      };

      try {
        await spacesService.removeSpaceMember(spaceId, profileId);
        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    },
  );

  // Update space member role
  fastify.patch(
    '/api/spaces/:spaceId/members/:profileId/role',
    async (request, reply) => {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { spaceId, profileId } = request.params as {
        spaceId: string;
        profileId: string;
      };
      const { role } = request.body as { role: any };

      try {
        const membership = await spacesService.updateSpaceMemberRole(
          spaceId,
          profileId,
          role,
        );
        reply.send(membership);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    },
  );

  // Get space conversations
  fastify.get('/api/spaces/:spaceId/conversations', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };

    try {
      const conversations = await spacesService.getSpaceConversations(spaceId);
      reply.send(conversations);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Create conversation in space
  fastify.post('/api/spaces/:spaceId/conversations', async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { spaceId } = request.params as { spaceId: string };
    const data = request.body as {
      id: string;
      title: string;
      profileId?: string;
    };

    try {
      // First create the conversation using the existing chat service
      const conversation = await chatService.createConversation({
        ...data,
        space_id: spaceId, // Pass space_id to the chat service
      });

      // Emit socket event for real-time updates
      fastify.io.to(`space:${spaceId}`).emit('space_conversation_created', {
        spaceId,
        conversation,
      });

      reply.code(201).send(conversation);
    } catch (error: any) {
      if (error.message === 'Space not found') {
        reply.code(404).send({ error: error.message });
      } else {
        reply.code(400).send({ error: error.message });
      }
    }
  });
}
