import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { profileService } from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';

import {
  CreateProfileRequest,
  UpdateProfileRequest,
  DeleteProfileRequest,
  GetProfileRequest,
} from '../types/profile.types';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function profilesRoutes(fastify: FastifyInstance) {
  fastify.post<CreateProfileRequest>(
    '/api/profiles',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateProfileRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { displayName, avatarUrl, bio } = request.body || {};

        const profile = await profileService
          .scoped(getClients(request))
          .createOrUpdateProfile(userId, { displayName, avatarUrl, bio });

        reply.code(201).send(profile);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create profile' });
      }
    }
  );

  fastify.patch<UpdateProfileRequest>(
    '/api/profiles/:profileId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateProfileRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { profileId } = request.params;
        const { displayName, avatarUrl, bio } = request.body || {};

        const profile = await profileService
          .scoped(getClients(request))
          .updateProfile(userId, profileId, { displayName, avatarUrl, bio });

        reply.send(profile);
      } catch (error: any) {
        if (error.message.includes('another user')) {
          reply
            .code(403)
            .send({ error: "Cannot update another user's profile" });
        } else {
          reply.code(400).send({ error: 'Failed to update profile' });
        }
      }
    }
  );

  fastify.delete<DeleteProfileRequest>(
    '/api/profiles/:profileId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteProfileRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Unauthorized' });
          return;
        }

        const { profileId } = request.params;

        await profileService
          .scoped(getClients(request))
          .deleteProfile(userId, profileId);

        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('another user')) {
          reply
            .code(403)
            .send({ error: "Cannot delete another user's profile" });
        } else if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Profile not found' });
        } else {
          reply.code(400).send({ error: 'Failed to delete profile' });
        }
      }
    }
  );

  fastify.get<GetProfileRequest>(
    '/api/profiles/:profileId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profileId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetProfileRequest>, reply: FastifyReply) => {
      try {
        const { profileId } = request.params;

        const profile = await profileService
          .scoped(getClients(request))
          .getProfile(profileId);

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
}
