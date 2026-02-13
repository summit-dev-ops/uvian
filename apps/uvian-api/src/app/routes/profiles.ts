import { FastifyInstance } from 'fastify';
import { profileService } from '../services/profile.service';
import { ProfileSearchFilters } from '../types/profile.typs';
import { userService } from '../services/user.service';

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/profiles', async (request, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        reply.code(404).send({ error: 'Not authenticated' });
        return;
      }

      const profileId = await profileService.getCurrentProfileFromRequest(
        request
      );

      const data = request.body as {
        displayName: string;
        avatarUrl?: string | null;
        bio?: string | null;
        agentConfig?: any;
        publicFields?: Record<string, any>;
        type?: 'human' | 'agent' | 'system' | 'admin';
      };

      const existingProfile = await profileService.getProfile(
        request.supabase,
        profileId,
        userId
      );

      if (existingProfile) {
        reply.code(409).send({ error: 'This Profile already exists' });
        return;
      }

      const profile = await profileService.createProfile(
        request.supabase,
        profileId,
        userId,
        data
      );
      reply.code(201).send(profile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  fastify.patch('/api/profiles/:profileId', async (request, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        reply.code(404).send({ error: 'Not authenticated' });
        return;
      }

      const { profileId } = request.params as { profileId: string };

      const data = request.body as {
        displayName: string;
        avatarUrl?: string | null;
        bio?: string | null;
        agentConfig?: any;
        publicFields?: Record<string, any>;
      };

      const newProfile = await profileService.updateProfile(
        request.supabase,
        profileId,
        userId,
        data
      );
      reply.code(201).send(newProfile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Delete profile
  fastify.delete('/api/profiles/:profileId', async (request, reply) => {
    const userId = await userService.getCurrentUserFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { profileId } = request.params as { profileId: string };

    try {
      await profileService.deleteProfile(request.supabase, profileId, userId);
      reply.code(204).send();
    } catch (error: any) {
      if (error.message === 'User profile not found') {
        reply.code(401).send({ error: error.message });
      } else {
        reply.code(400).send({ error: error.message });
      }
    }
  });

  fastify.get('/api/profiles/:profileId', async (request, reply) => {
    try {
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }

      const { profileId } = request.params as { profileId: string };
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
  });

  fastify.get('/api/profiles/search', async (request, reply) => {
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
      } = (request.query as any) || {};

      const searchFilters: ProfileSearchFilters = {
        query: query || '',
        type: type ? (Array.isArray(type) ? type : [type]) : ['human', 'agent'],
        sortBy:
          sortBy === 'relevance' || sortBy === 'createdAt'
            ? sortBy
            : 'relevance',
        sortOrder:
          sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc',
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
      };

      if (searchFilters.type) {
        searchFilters.type = searchFilters.type.filter(
          (t: string) => t === 'human' || t === 'agent'
        ) as ('human' | 'agent')[];
        if (searchFilters.type.length === 0) {
          searchFilters.type = ['human', 'agent'];
        }
      }

      const searchResults = await profileService.searchProfiles(
        request.supabase,
        searchFilters
      );
      reply.send(searchResults);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
