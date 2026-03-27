import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { providerService } from '../services/provider.service';
import { createUserClient } from '../clients/supabase.client';

interface GetAutomationProvidersParams {
  accountId: string;
}

interface CreateAutomationProviderParams {
  accountId: string;
}

interface CreateProviderBody {
  name: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, unknown>;
  is_active?: boolean;
}

interface UpdateAutomationProviderParams {
  accountId: string;
  automationProviderId: string;
}

interface UpdateProviderBody {
  name?: string;
  type?: 'internal' | 'webhook';
  url?: string;
  auth_method?: 'none' | 'bearer' | 'api_key';
  auth_config?: Record<string, unknown>;
  is_active?: boolean;
}

interface DeleteAutomationProviderParams {
  accountId: string;
  automationProviderId: string;
}

function getUserClient(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  return createUserClient(token);
}

export default async function providerRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: GetAutomationProvidersParams }>(
    '/api/accounts/:accountId/automation-providers',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetAutomationProvidersParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const userClient = getUserClient(request);

        const providers = await providerService.getProvidersByAccount(
          userClient,
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

  fastify.post<{
    Params: CreateAutomationProviderParams;
    Body: CreateProviderBody;
  }>(
    '/api/accounts/:accountId/automation-providers',
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
      request: FastifyRequest<{
        Params: CreateAutomationProviderParams;
        Body: CreateProviderBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const userClient = getUserClient(request);

        const provider = await providerService.createProvider(
          userClient,
          userId,
          accountId,
          {
            ...request.body,
            account_id: accountId,
            owner_user_id: userId,
          }
        );

        fastify.eventEmitter.emitAutomationProviderCreated(
          { automationProviderId: provider.id, accountId, name: provider.name },
          userId
        );

        reply.send({ provider });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create provider' });
      }
    }
  );

  fastify.put<{
    Params: UpdateAutomationProviderParams;
    Body: UpdateProviderBody;
  }>(
    '/api/accounts/:accountId/automation-providers/:automationProviderId',
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
      request: FastifyRequest<{
        Params: UpdateAutomationProviderParams;
        Body: UpdateProviderBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, automationProviderId } = request.params;
        const userClient = getUserClient(request);

        const provider = await providerService.updateProvider(
          userClient,
          userId,
          automationProviderId,
          accountId,
          request.body
        );

        fastify.eventEmitter.emitAutomationProviderUpdated(
          { automationProviderId: provider.id, accountId },
          userId
        );

        reply.send({ provider });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update provider' });
      }
    }
  );

  fastify.delete<{ Params: DeleteAutomationProviderParams }>(
    '/api/accounts/:accountId/automation-providers/:automationProviderId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: DeleteAutomationProviderParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, automationProviderId } = request.params;
        const userClient = getUserClient(request);

        const existingProvider = await providerService.getProviderById(
          userClient,
          automationProviderId,
          accountId
        );
        if (existingProvider?.type === 'internal') {
          reply.code(400).send({ error: 'Cannot delete internal provider' });
          return;
        }

        await providerService.deleteProvider(
          userClient,
          userId,
          automationProviderId,
          accountId
        );

        fastify.eventEmitter.emitAutomationProviderDeleted(
          { automationProviderId, accountId },
          userId
        );

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete provider' });
      }
    }
  );
}
