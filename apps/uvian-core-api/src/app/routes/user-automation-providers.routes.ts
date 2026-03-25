import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userAutomationProviderService } from '../services/user-automation-provider.service';
import { providerService } from '../services/provider.service';
import { adminSupabase } from '../clients/supabase.client';
import type { Database } from '../clients/supabase.client';

type UserAutomationProvider =
  Database['public']['Tables']['user_automation_providers']['Row'];

type AutomationProvider =
  Database['public']['Tables']['automaton_providers']['Row'];

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

async function verifyUserAccess(
  supabase: typeof adminSupabase,
  requestUserId: string,
  targetUserId: string
): Promise<void> {
  if (requestUserId !== targetUserId) {
    throw new Error("Not authorized to access this user's resources");
  }
}

export default async function userAutomationProviderRoutes(
  fastify: FastifyInstance
) {
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
        await verifyUserAccess(adminSupabase, requestUserId, userId);

        const userProviders =
          await userAutomationProviderService.getProvidersByUser(userId);

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
        reply
          .code(400)
          .send({
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
        await verifyUserAccess(adminSupabase, requestUserId, userId);

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

        const provider = await providerService.getProviderById(
          request.body.automation_provider_id,
          accountId
        );

        if (!provider) {
          reply.code(404).send({ error: 'Provider not found' });
          return;
        }

        const userProvider =
          await userAutomationProviderService.linkUserToProvider(
            userId,
            request.body.automation_provider_id
          );

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
        await verifyUserAccess(adminSupabase, requestUserId, userId);

        const existing = await userAutomationProviderService.getProviderById(
          id
        );
        if (!existing) {
          reply.code(404).send({ error: 'Provider link not found' });
          return;
        }

        if (existing.user_id !== userId) {
          reply
            .code(403)
            .send({ error: 'Not authorized to unlink this provider' });
          return;
        }

        await userAutomationProviderService.unlinkUserFromProvider(id, userId);

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to unlink provider' });
      }
    }
  );
}
