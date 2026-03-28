import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { automationProviderService } from '../services';
import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type UserAutomationProvider =
  Database['public']['Tables']['user_automation_providers']['Row'];

type AutomationProvider =
  Database['public']['Tables']['automaton_providers']['Row'];

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

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

interface GetUserAutomationProvidersParams {
  userId: string;
}

interface LinkUserAutomationProviderParams {
  userId: string;
}

interface LinkUserAutomationProviderBody {
  automation_provider_id: string;
}

interface ManageUserAutomationProviderParams {
  userId: string;
  id: string;
}

export default async function automationProviderRoutes(
  fastify: FastifyInstance
) {
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

        const providers = await automationProviderService
          .scoped(clients)
          .getProvidersByAccount(accountId);
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

        const provider = await automationProviderService
          .scoped(clients)
          .createProvider(userId, accountId, {
            ...request.body,
            account_id: accountId,
            owner_user_id: userId,
          });

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

        const provider = await automationProviderService
          .scoped(clients)
          .updateProvider(
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

        const existingProvider = await automationProviderService
          .scoped(clients)
          .getProviderById(automationProviderId, accountId);
        if (existingProvider?.type === 'internal') {
          reply.code(400).send({ error: 'Cannot delete internal provider' });
          return;
        }

        await automationProviderService
          .scoped(clients)
          .deleteProvider(userId, automationProviderId, accountId);

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

  fastify.get<{ Params: GetUserAutomationProvidersParams }>(
    '/api/users/:userId/automation-providers',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetUserAutomationProvidersParams }>,
      reply: FastifyReply
    ) => {
      try {
        const requestUserId = request.user?.id;
        if (!requestUserId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { userId } = request.params;
        if (requestUserId !== userId) {
          reply.code(403).send({ error: 'Not authorized' });
          return;
        }

        const clients = getClients(request);
        const userProviders = await automationProviderService
          .scoped(clients)
          .getUserProviderLinks(userId);

        if (userProviders.length === 0) {
          reply.send({ automationProviders: [] });
          return;
        }

        const providerIds = userProviders.map((p) => p.automation_provider_id);

        const { data: providers, error } = await adminSupabase
          .from('automaton_providers')
          .select('*')
          .in('id', providerIds);

        if (error) {
          throw new Error(`Failed to fetch providers: ${error.message}`);
        }

        const providerMap = new Map<string, AutomationProvider>(
          (providers || []).map((p) => [p.id, p])
        );

        const linkedProviders: Array<
          UserAutomationProvider & { provider: AutomationProvider }
        > = userProviders
          .map((up) => {
            const provider = providerMap.get(up.automation_provider_id);
            if (!provider) return null;
            return { ...up, provider };
          })
          .filter(Boolean) as Array<
          UserAutomationProvider & { provider: AutomationProvider }
        >;

        reply.send({ automationProviders: linkedProviders });
      } catch (error: any) {
        reply.code(400).send({
          error: error.message || 'Failed to fetch automation providers',
        });
      }
    }
  );

  fastify.post<{
    Params: LinkUserAutomationProviderParams;
    Body: LinkUserAutomationProviderBody;
  }>(
    '/api/users/:userId/automation-providers',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['automation_provider_id'],
          properties: {
            automation_provider_id: { type: 'string', format: 'uuid' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: LinkUserAutomationProviderParams;
        Body: LinkUserAutomationProviderBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const requestUserId = request.user?.id;
        if (!requestUserId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { userId } = request.params;
        if (requestUserId !== userId) {
          reply.code(403).send({ error: 'Not authorized' });
          return;
        }

        const { data: accountMember, error: memberError } = await adminSupabase
          .from('account_members')
          .select('account_id')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (memberError || !accountMember) {
          reply.code(404).send({ error: 'User not found in any account' });
          return;
        }

        const accountId = accountMember.account_id;

        const clients = getClients(request);
        const provider = await automationProviderService
          .scoped(clients)
          .getProviderById(request.body.automation_provider_id, accountId);

        if (!provider) {
          reply.code(404).send({ error: 'Provider not found' });
          return;
        }

        const userProvider = await automationProviderService
          .scoped(clients)
          .linkUserToProvider(userId, request.body.automation_provider_id);

        reply.send({ userAutomationProvider: userProvider });
      } catch (error: any) {
        if (error.message.includes('duplicate')) {
          reply
            .code(409)
            .send({ error: 'User already linked to this provider' });
          return;
        }
        reply
          .code(400)
          .send({ error: error.message || 'Failed to link provider' });
      }
    }
  );

  fastify.delete<{ Params: ManageUserAutomationProviderParams }>(
    '/api/users/:userId/automation-providers/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: ManageUserAutomationProviderParams }>,
      reply: FastifyReply
    ) => {
      try {
        const requestUserId = request.user?.id;
        if (!requestUserId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { userId, id } = request.params;
        if (requestUserId !== userId) {
          reply.code(403).send({ error: 'Not authorized' });
          return;
        }

        const clients = getClients(request);
        await automationProviderService
          .scoped(clients)
          .unlinkUserFromProvider(userId, id);

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to unlink provider' });
      }
    }
  );
}
