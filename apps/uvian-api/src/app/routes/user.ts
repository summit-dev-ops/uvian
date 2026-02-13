import { FastifyInstance } from 'fastify';
import { userService } from '../services/user.service';

export default async function (fastify: FastifyInstance) {
  // Get current user's settings
  fastify.get('/api/users/me/settings', async (request: any, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);

      if (!userId) {
        reply.code(404).send({ error: 'Not authenticated' });
        return;
      }

      const settings = await userService.getSettings(request.supabase, userId);

      if (!settings) {
        // Return empty settings if none exist yet
        reply.send({
          profileId: userId,
          settings: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      reply.send(settings);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Update current user's settings
  fastify.put('/api/users/me/settings', async (request: any, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);

      if (!userId) {
        reply.code(404).send({ error: 'Not authenticated' });
        return;
      }

      const settings = request.body as Record<string, any>;

      if (!settings || typeof settings !== 'object') {
        reply.code(400).send({ error: 'Settings must be a valid object' });
        return;
      }

      const updatedSettings = await userService.updateSettings(
        request.supabase,
        userId,
        settings
      );
      reply.send(updatedSettings);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Delete current user's settings
  fastify.delete('/api/users/me/settings', async (request: any, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        reply.code(404).send({ error: 'Not authenticated' });
        return;
      }

      await userService.deleteSettings(request.supabase, userId);
      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
