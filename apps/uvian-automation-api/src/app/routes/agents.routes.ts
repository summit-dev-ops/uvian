import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { encrypt } from '@org/utils-encryption';

interface InitAgentBody {
  user_id: string;
  account_id: string;
  api_key: string;
  api_key_prefix: string;
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

        const encryptionSecret = process.env.SECRET_INTERNAL_API_KEY;
        if (!encryptionSecret) {
          throw new Error(
            'SECRET_INTERNAL_API_KEY environment variable is required'
          );
        }

        const encryptedApiKey = encrypt(api_key, encryptionSecret);

        const { data: agent, error: agentError } = await adminSupabase
          .schema('core_automation')
          .from('agents')
          .insert({
            user_id,
            account_id,
            is_active: true,
          })
          .select('id')
          .single();

        if (agentError) {
          reply.code(400).send({ error: agentError.message });
          return;
        }

        const secret = await adminSupabase
          .schema('public')
          .from('secrets')
          .insert({
            account_id,
            name: 'Uvian Hub API Key',
            value_type: 'text',
            encrypted_value: encryptedApiKey,
            metadata: { api_key_prefix },
            is_active: true,
          })
          .select()
          .single();

        if (secret.error) {
          reply.code(400).send({ error: secret.error.message });
          return;
        }

        const hubMcpUrl = `${request.headers.origin}/v1/mcp`;

        const { data: hubMcp, error: mcpError } = await adminSupabase
          .schema('core_automation')
          .from('mcps')
          .upsert(
            {
              account_id,
              name: 'Uvian Hub',
              type: 'external',
              auth_method: 'bearer',
              url: hubMcpUrl,
              config: {
                system: true,
                description: 'Uvian Hub event and messaging MCP',
              },
              is_active: true,
            },
            { onConflict: 'account_id' }
          )
          .select()
          .single();

        if (mcpError) {
          reply.code(400).send({ error: mcpError.message });
          return;
        }

        const { error: linkError } = await adminSupabase
          .schema('core_automation')
          .from('agent_mcps')
          .insert({
            agent_id: agent.id,
            mcp_id: hubMcp.id,
            secret_id: secret.data.id,
          });

        if (linkError) {
          reply.code(400).send({ error: linkError.message });
          return;
        }

        reply.send({
          success: true,
          message: 'Agent initialized with Hub MCP',
        });
      } catch (error: any) {
        reply
          .code(500)
          .send({ error: error.message || 'Failed to initialize agent' });
      }
    }
  );
}
