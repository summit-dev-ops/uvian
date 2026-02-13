import { FastifyInstance } from 'fastify';
import { spacesService } from '../services/spaces.service';
import { profileService } from '../services/profile.service';
import {
  CreateSpaceRequest,
  SpaceMemberRole,
  UpdateSpaceMemberRoleRequest,
  UpdateSpaceRequest,
} from '../types/spaces.types';

export default async function spacesRoutes(fastify: FastifyInstance) {
  // Create a new space
  fastify.post<{ Body: CreateSpaceRequest }>(
    '/api/spaces',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            avatar_url: { type: 'string' },
            settings: { type: 'object' },
            is_private: { type: 'boolean' },
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

        const data = request.body;

        const space = await spacesService.createSpace(
          request.supabase,
          authProfileId,
          data
        );
        reply.code(201).send(space);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get user's spaces
  fastify.get(
    '/api/spaces',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const spaces = await spacesService.getSpaces(
          request.supabase,
          authProfileId
        );
        reply.send(spaces);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get space stats
  fastify.get(
    '/api/spaces/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const stats = await spacesService.getSpaceStats(
          request.supabase,
          authProfileId
        );
        reply.send(stats);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get specific space
  fastify.get<{ Params: { spaceId: string } }>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: {
            spaceId: { type: 'string' },
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
        const { spaceId } = request.params;
        const space = await spacesService.getSpace(request.supabase, spaceId);
        if (!space) {
          reply.code(404).send({ error: 'Space not found' });
          return;
        }
        reply.send(space);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Update space
  fastify.patch<{ Params: { spaceId: string }; Body: UpdateSpaceRequest }>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: {
            spaceId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            avatar_url: { type: 'string' },
            settings: { type: 'object' },
            is_private: { type: 'boolean' },
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
        const { spaceId } = request.params;
        const data = request.body;

        const space = await spacesService.updateSpace(
          request.supabase,
          spaceId,
          authProfileId,
          data
        );
        reply.send(space);
      } catch (error: any) {
        if (error.message === 'User profile not found') {
          reply.code(401).send({ error: error.message });
        } else {
          reply.code(400).send({ error: error.message });
        }
      }
    }
  );

  // Delete space
  fastify.delete<{ Params: { spaceId: string } }>(
    '/api/spaces/:spaceId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: {
            spaceId: { type: 'string' },
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
        const { spaceId } = request.params;

        await spacesService.deleteSpace(
          request.supabase,
          spaceId,
          authProfileId
        );
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

  // Get space members
  fastify.get<{ Params: { spaceId: string } }>(
    '/api/spaces/:spaceId/members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: {
            spaceId: { type: 'string' },
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
        const { spaceId } = request.params;
        const members = await spacesService.getSpaceMembers(
          request.supabase,
          spaceId
        );
        reply.send(members);
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Invite space member
  fastify.post(
    '/api/spaces/:spaceId/members/invite',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId'],
          properties: {
            spaceId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['profileId'],
          properties: {
            profile_id: { type: 'string' },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['admin', 'member', 'owner'] },
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
        const { spaceId } = request.params as { spaceId: string };
        const { profileId, role } = request.body as {
          profileId: string;
          role: SpaceMemberRole;
        };
        const membership = await spacesService.inviteSpaceMember(
          request.supabase,
          spaceId,
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

  // Remove space member
  fastify.delete<{ Params: { spaceId: string; profileId: string } }>(
    '/api/spaces/:spaceId/members/:profileId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId', 'profileId'],
          properties: {
            spaceId: { type: 'string' },
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
        const { spaceId, profileId: targetProfileId } = request.params as {
          spaceId: string;
          profileId: string;
        };

        await spacesService.removeSpaceMember(
          request.supabase,
          spaceId,
          authProfileId,
          targetProfileId
        );
        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: error.message });
      }
    }
  );

  // Update space member role
  fastify.patch<{
    Params: { spaceId: string; profileId: string };
    Body: UpdateSpaceMemberRoleRequest;
  }>(
    '/api/spaces/:spaceId/members/:profileId/role',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['spaceId', 'profileId'],
          properties: {
            spaceId: { type: 'string' },
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
                name: { type: 'string', enum: ['admin', 'member', 'owner'] },
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
        const { spaceId, profileId: targetProfileId } = request.params as {
          spaceId: string;
          profileId: string;
        };
        const { role } = request.body;

        const membership = await spacesService.updateSpaceMemberRole(
          request.supabase,
          spaceId,
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
}
