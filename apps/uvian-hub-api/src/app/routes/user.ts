import { FastifyInstance } from 'fastify';
import {
  userService,
  accountService,
  profileService,
} from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';
import {
  GetUserSettingsRequest,
  UpdateUserSettingsRequest,
  DeleteUserSettingsRequest,
  GetUserAccountRequest,
  GetUserProfileRequest,
} from '../types/users.types';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function (fastify: FastifyInstance) {
  // Get current user's account
  fastify.get<GetUserAccountRequest>(
    '/api/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const accounts = await accountService
          .scoped(getClients(request))
          .getAccounts(userId);

        if (!accounts || accounts.length === 0) {
          reply.code(404).send({ error: 'Account not found' });
          return;
        }

        reply.send(accounts[0]);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch account' });
      }
    }
  );

  // Get current user's profile
  fastify.get<GetUserProfileRequest>(
    '/api/users/me/profile',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const profile = await profileService
          .scoped(getClients(request))
          .getProfileByUserId(userId);

        reply.send(profile);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Profile not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch profile' });
        }
      }
    }
  );

  // Get current user's settings
  fastify.get<GetUserSettingsRequest>(
    '/api/users/me/settings',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const settings = await userService
          .scoped(getClients(request))
          .getSettings(userId);

        if (!settings) {
          reply.send({
            userId,
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        reply.send(settings);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch settings' });
      }
    }
  );

  // Update current user's settings
  fastify.put<UpdateUserSettingsRequest>(
    '/api/users/me/settings',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['settings'],
          properties: {
            settings: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { settings } = request.body;

        if (!settings || typeof settings !== 'object') {
          reply.code(400).send({ error: 'Settings must be a valid object' });
          return;
        }

        const updatedSettings = await userService
          .scoped(getClients(request))
          .updateSettings(userId, settings);

        reply.send(updatedSettings);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to update settings' });
      }
    }
  );

  // Delete current user's settings
  fastify.delete<DeleteUserSettingsRequest>(
    '/api/users/me/settings',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        await userService.scoped(getClients(request)).deleteSettings(userId);

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to delete settings' });
      }
    }
  );
}
