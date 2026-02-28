import { FastifyInstance } from 'fastify';
import {
  GetUserSettingsRequest,
  UpdateUserSettingsRequest,
  DeleteUserSettingsRequest,
  GetUserAccountRequest,
  GetUserProfileRequest,
} from '../types/users.types';

export default async function (fastify: FastifyInstance) {
  // Get current user's account
  fastify.get<GetUserAccountRequest>(
    '/api/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { data, error } = await request.supabase
          .from('get_my_account')
          .select('*')
          .single();

        if (error || !data) {
          reply.code(404).send({ error: 'Account not found' });
          return;
        }

        reply.send(data);
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
        const { data, error } = await request.supabase
          .from('get_my_profile')
          .select('*')
          .single();

        if (error || !data) {
          reply.code(404).send({ error: 'Profile not found' });
          return;
        }

        reply.send(data);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch profile' });
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
        const { data, error } = await request.supabase
          .from('get_my_settings')
          .select('*')
          .single();

        if (error || !data) {
          reply.send({
            userId: request.user?.id,
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        reply.send(data);
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

        const { data, error } = await request.supabase
          .from('settings')
          .upsert({
            user_id: userId,
            settings,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          reply.code(400).send({ error: 'Failed to update settings' });
          return;
        }

        reply.send(data);
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

        const { error } = await request.supabase
          .from('settings')
          .delete()
          .eq('user_id', userId);

        if (error) {
          reply.code(400).send({ error: 'Failed to delete settings' });
          return;
        }

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to delete settings' });
      }
    }
  );
}
