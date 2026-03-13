import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { automationProviderService } from '../services/automation-provider.service.js';
import { accountService } from '../services/account.service.js';
import {
  CreateAutomationProviderRequest,
  GetAutomationProvidersRequest,
  UpdateAutomationProviderRequest,
  DeleteAutomationProviderRequest,
} from '../types/automation-provider.types.js';

export default async function providerRoutes(fastify: FastifyInstance) {
  fastify.get<GetAutomationProvidersRequest>(
    '/api/accounts/:accountId/providers',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<GetAutomationProvidersRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        await accountService.getAccount(accountId, userId);

        const providers = await automationProviderService.getProvidersByAccount(
          accountId
        );
        reply.send({ providers });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch providers' });
      }
    }
  );

  fastify.post<CreateAutomationProviderRequest>(
    '/api/accounts/:accountId/providers',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['internal', 'webhook'] },
            url: { type: 'string' },
            auth_method: {
              type: 'string',
              enum: ['none', 'bearer', 'api_key'],
            },
            auth_config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateAutomationProviderRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        await accountService.getAccount(accountId, userId);

        const provider = await automationProviderService.createProvider(
          accountId,
          userId,
          request.body
        );
        reply.send({ provider });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create provider' });
      }
    }
  );

  fastify.put<UpdateAutomationProviderRequest>(
    '/api/accounts/:accountId/providers/:providerId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['internal', 'webhook'] },
            url: { type: 'string' },
            auth_method: {
              type: 'string',
              enum: ['none', 'bearer', 'api_key'],
            },
            auth_config: { type: 'object' },
            is_active: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateAutomationProviderRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, providerId } = request.params;
        await accountService.getAccount(accountId, userId);

        const provider = await automationProviderService.updateProvider(
          providerId,
          accountId,
          request.body
        );
        reply.send({ provider });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update provider' });
      }
    }
  );

  fastify.delete<DeleteAutomationProviderRequest>(
    '/api/accounts/:accountId/providers/:providerId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<DeleteAutomationProviderRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, providerId } = request.params;
        await accountService.getAccount(accountId, userId);

        const existingProvider =
          await automationProviderService.getProviderById(
            providerId,
            accountId
          );
        if (existingProvider?.type === 'internal') {
          reply.code(400).send({ error: 'Cannot delete internal provider' });
          return;
        }

        await automationProviderService.deleteProvider(providerId, accountId);
        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete provider' });
      }
    }
  );
}
