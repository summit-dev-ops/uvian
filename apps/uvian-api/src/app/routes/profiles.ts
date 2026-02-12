import { FastifyInstance } from 'fastify';
import {
  profileService,
  ProfileSearchFilters,
} from '../services/profile.service';

export default async function (fastify: FastifyInstance) {
  // Get current user's profile (full profile with updatedAt)
  fastify.get('/api/profiles/me', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
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

  // Update current user's profile
  fastify.put('/api/profiles/me', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
      );

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      const data = request.body as {
        displayName?: string;
        avatarUrl?: string | null;
        bio?: string | null;
        agentConfig?: any;
        publicFields?: Record<string, any>;
        isActive?: boolean;
      };

      const updatedProfile = await profileService.updateProfile(
        profile.id,
        data
      );
      reply.send(updatedProfile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Create current user's profile (for new users)
  fastify.post('/api/profiles', async (request: any, reply) => {
    try {
      const authUserId = await profileService.getCurrentUserFromRequest(
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

      // Check if profile already exists
      const existingProfile = await profileService.getProfileByAuthUserId(
        authUserId
      );
      if (existingProfile) {
        reply.code(409).send({ error: 'Profile already exists' });
        return;
      }

      const profile = await profileService.createProfile(authUserId, data);
      reply.code(201).send(profile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get a profile by profile ID (for viewing by other authenticated users)
  fastify.get('/api/profiles/:profileId', async (request: any, reply) => {
    try {
      const { profileId } = request.params as { profileId: string };
      const profile = await profileService.getProfile(profileId);

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      reply.send(profile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Delete current user's profile (hard delete)
  fastify.delete('/api/profiles/me', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
      );

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      // Delete profile and settings (settings will cascade due to foreign key)
      await profileService.deleteProfile(profile.id);

      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get current user's settings
  fastify.get('/api/profiles/me/settings', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
      );

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      const settings = await profileService.getSettings(profile.id);

      if (!settings) {
        // Return empty settings if none exist yet
        reply.send({
          profileId: profile.id,
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
  fastify.put('/api/profiles/me/settings', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
      );

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      const settings = request.body as Record<string, any>;

      if (!settings || typeof settings !== 'object') {
        reply.code(400).send({ error: 'Settings must be a valid object' });
        return;
      }

      const updatedSettings = await profileService.updateSettings(
        profile.id,
        settings
      );
      reply.send(updatedSettings);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Delete current user's settings
  fastify.delete('/api/profiles/me/settings', async (request: any, reply) => {
    try {
      const profile = await profileService.getCurrentProfileFromRequest(
        request
      );

      if (!profile) {
        reply.code(404).send({ error: 'Profile not found' });
        return;
      }

      await profileService.deleteSettings(profile.id);
      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Create agent profile (for humans creating AI agents)
  fastify.post('/api/profiles/agents', async (request: any, reply) => {
    try {
      const authUserId = await profileService.getCurrentUserFromRequest(
        request
      );
      const data = request.body as {
        displayName: string;
        avatarUrl?: string | null;
        bio?: string | null;
        agentConfig: any;
        publicFields?: Record<string, any>;
      };

      // Validate agent config
      if (!data.agentConfig) {
        reply
          .code(400)
          .send({ error: 'Agent config is required for agent profiles' });
        return;
      }

      const agentProfile = await profileService.createAgentProfile(
        data,
        authUserId
      );
      reply.code(201).send(agentProfile);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Get agent profiles
  fastify.get('/api/profiles/agents', async (request: any, reply) => {
    try {
      const authUserId = await profileService.getCurrentUserFromRequest(
        request
      );
      const agentProfiles = await profileService.getAgentProfiles(authUserId);
      reply.send(agentProfiles);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });

  // Search profiles for inviting to spaces and conversations
  fastify.get('/api/profiles/search', async (request: any, reply) => {
    try {
      // Extract query parameters with validation
      const {
        query,
        type,
        sortBy = 'relevance',
        sortOrder = 'desc',
        page = '1',
        limit = '20',
      } = request.query || {};

      // Convert and validate parameters
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

      // Validate profile types (only human and agent allowed)
      if (searchFilters.type) {
        searchFilters.type = searchFilters.type.filter(
          (t: string) => t === 'human' || t === 'agent'
        ) as ('human' | 'agent')[];
        if (searchFilters.type.length === 0) {
          searchFilters.type = ['human', 'agent'];
        }
      }

      const searchResults = await profileService.searchProfiles(searchFilters);
      reply.send(searchResults);
    } catch (error: any) {
      reply.code(400).send({ error: error.message });
    }
  });
}
