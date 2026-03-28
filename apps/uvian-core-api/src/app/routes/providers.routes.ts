import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { providerService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

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

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
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
        const clients = getClients(request);

        const providers = await providerService.getProvidersByAccount(
          clients,
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
        const clients = getClients(request);

        const provider = await providerService.createProvider(
          clients,
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
        const clients = getClients(request);

        const provider = await providerService.updateProvider(
          clients,
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
        const clients = getClients(request);

        const existingProvider = await providerService.getProviderById(
          clients,
          automationProviderId,
          accountId
        );
        if (existingProvider?.type === 'internal') {
          reply.code(400).send({ error: 'Cannot delete internal provider' });
          return;
        }

        await providerService.deleteProvider(
          clients,
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
