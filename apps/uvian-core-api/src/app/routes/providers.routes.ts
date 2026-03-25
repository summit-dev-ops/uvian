import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { providerService } from '../services/provider.service';
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

async function verifyAccountAccess(
  supabase: typeof adminSupabase,
  accountId: string,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('account_members')
    .select('account_id')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Account not found or access denied');
  }
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
        await verifyAccountAccess(adminSupabase, accountId, userId);

        const providers = await providerService.getProvidersByAccount(
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
        await verifyAccountAccess(adminSupabase, accountId, userId);

        const provider = await providerService.createProvider(
          accountId,
          userId,
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
        await verifyAccountAccess(adminSupabase, accountId, userId);

        const provider = await providerService.updateProvider(
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
        await verifyAccountAccess(adminSupabase, accountId, userId);

        const existingProvider = await providerService.getProviderById(
          automationProviderId,
          accountId
        );
        if (existingProvider?.type === 'internal') {
          reply.code(400).send({ error: 'Cannot delete internal provider' });
          return;
        }

        await providerService.deleteProvider(automationProviderId, accountId);

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
