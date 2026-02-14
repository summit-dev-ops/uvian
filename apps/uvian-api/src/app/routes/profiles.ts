import { FastifyInstance } from 'fastify';
import { profileService } from '../services/profile.service';
import {
  CreateProfileRequest,
  DeleteProfileRequest,
  GetProfileRequest,
  ProfileSearchFilters,
  SearchProfilesRequest,
  UpdateProfileRequest,
} from '../types/profile.types';
import { userService } from '../services/user.service';

export default async function profilesRoutes(fastify: FastifyInstance) {
  fastify.post<CreateProfileRequest>(
    '/api/profiles',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['displayName'],
          properties: {
            displayName: { type: 'string', minLength: 1 },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' },
            agentConfig: { type: 'object' },
            publicFields: { type: 'object' },
            type: {
              type: 'string',
              enum: ['human', 'agent', 'system', 'admin'],
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

        const userId = await userService.getCurrentUserFromRequest(request);
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const data = request.body;

        const existingProfile = await profileService.getProfile(
          request.supabase,
          authProfileId,
        );

        if (existingProfile) {
          reply.code(409).send({ error: 'This Profile already exists' });
          return;
        }

        const profile = await profileService.createProfile(
          request.supabase,
          authProfileId,
          userId,
          data
        );
        reply.code(201).send(profile);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
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
            displayName: { type: 'string', minLength: 1 },
            avatarUrl: { type: 'string' },
            bio: { type: 'string' },
            agentConfig: { type: 'object' },
            publicFields: { type: 'object' },
            isActive: { type: 'boolean' },
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
        const userId = await userService.getCurrentUserFromRequest(request);
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { profileId } = request.params;
        const data = request.body;

        const newProfile = await profileService.updateProfile(
          request.supabase,
          profileId,
          userId,
          data
        );
        reply.send(newProfile);
      } catch (error: any) {
        if (error.message === 'User profile not found') {
          reply.code(401).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
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
        const userId = await userService.getCurrentUserFromRequest(request);
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { profileId } = request.params;

        await profileService.deleteProfile(request.supabase, profileId, userId);
        reply.code(204).send();
      } catch (error: any) {
        if (error.message === 'User profile not found') {
          reply.code(401).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
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
        const userId = await userService.getCurrentUserFromRequest(request);
        if (!userId) {
          reply.code(401).send({ error: 'Unauthorized' });
          return;
        }

        const { profileId } = request.params;
        const profile = await profileService.getProfile(
          request.supabase,
          profileId
        );

        if (!profile) {
          reply.code(404).send({ error: 'Profile not found' });
          return;
        }

        reply.send(profile);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  fastify.get<SearchProfilesRequest>(
    '/api/profiles/search',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            type: {
              anyOf: [
                { type: 'string' },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['human', 'agent', 'system', 'admin'],
                  },
                },
              ],
            },
            sortBy: { type: 'string', enum: ['relevance', 'createdAt'] },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
            page: { type: 'string' },
            limit: { type: 'string' },
          },
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
        const userId = await userService.getCurrentUserFromRequest(request);
        if (!userId) {
          reply.code(401).send({ error: 'Unauthorized' });
          return;
        }

        const {
          query,
          type,
          sortBy = 'relevance',
          sortOrder = 'desc',
          page = '1',
          limit = '20',
        } = request.query;

        const searchFilters: ProfileSearchFilters = {
          query: query || '',
          type: type
            ? Array.isArray(type)
              ? type
              : [type]
            : ['human', 'agent'],
          sortBy:
            sortBy === 'relevance' || sortBy === 'createdAt'
              ? sortBy
              : 'relevance',
          sortOrder:
            sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc',
          page: Math.max(1, parseInt(page) || 1),
          limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
        };

        const searchResults = await profileService.searchProfiles(
          request.supabase,
          searchFilters
        );
        reply.send(searchResults);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );
}
