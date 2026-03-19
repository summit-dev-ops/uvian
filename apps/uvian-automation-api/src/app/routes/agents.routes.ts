import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { encrypt, decrypt } from '../services/encryption.service.js';

interface InitAgentBody {
  user_id: string;
  account_id: string;
  api_key: string;
  api_key_prefix: string;
}

interface GetApiKeyParams {
  agentUserId: string;
}

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: InitAgentBody }>(
    '/api/agents/init',
    {
      preHandler: [fastify.authenticateInternal],
      schema: {
        body: {
          type: 'object',
          required: ['user_id', 'account_id', 'api_key', 'api_key_prefix'],
          properties: {
            user_id: { type: 'string' },
            account_id: { type: 'string' },
            api_key: { type: 'string' },
            api_key_prefix: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: InitAgentBody }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { user_id, account_id, api_key, api_key_prefix } = request.body;

        const encryptionSecret = process.env.INTERNAL_API_KEY;
        if (!encryptionSecret) {
          throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const encryptedApiKey = encrypt(api_key, encryptionSecret);

        const { error: keyError } = await adminSupabase
          .from('core_automation.automation_agent_keys')
          .insert({
            user_id,
            encrypted_api_key: encryptedApiKey,
            api_key_prefix,
            is_active: true,
          });

        if (keyError) {
          reply.code(400).send({ error: keyError.message });
          return;
        }

        const { error: agentError } = await adminSupabase
          .from('core_automation.agents')
          .insert({
            user_id,
            account_id,
            is_active: true,
          });

        if (agentError) {
          reply.code(400).send({ error: agentError.message });
          return;
        }

        reply.send({
          success: true,
          message: 'Agent initialized successfully',
        });
      } catch (error: any) {
        reply
          .code(500)
          .send({ error: error.message || 'Failed to initialize agent' });
      }
    }
  );

  fastify.get<{ Params: GetApiKeyParams }>(
    '/api/agents/:agentUserId/api-key',
    {
      preHandler: [fastify.authenticateWebhook],
      schema: {
        params: {
          type: 'object',
          required: ['agentUserId'],
          properties: {
            agentUserId: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: GetApiKeyParams }>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { agentUserId } = request.params;

        const { data, error } = await adminSupabase
          .from('core_automation.automation_agent_keys')
          .select('encrypted_api_key')
          .eq('user_id', agentUserId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          reply.code(404).send({ error: 'API key not found for this agent' });
          return;
        }

        if (!data.encrypted_api_key) {
          reply.code(404).send({ error: 'API key not found' });
          return;
        }

        const encryptionSecret = process.env.SECRET_API_KEY;
        if (!encryptionSecret) {
          throw new Error('SECRET_API_KEY environment variable is required');
        }

        const apiKey = decrypt(data.encrypted_api_key, encryptionSecret);

        reply.send({ api_key: apiKey });
      } catch (error: any) {
        console.log(error);
        reply
          .code(500)
          .send({ error: error.message || 'Failed to fetch API key' });
      }
    }
  );
}
