import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import crypto from 'crypto';

interface InitAgentBody {
  user_id: string;
  api_key: string;
  api_key_prefix: string;
}

interface GetApiKeyParams {
  agentUserId: string;
}

function encryptApiKey(apiKey: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encryptedKey: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const [ivHex, encrypted] = encryptedKey.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function verifyInternalApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers['authorization'];
  const expectedApiKey = process.env.INTERNAL_API_KEY;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ') ||
    authHeader.slice(7) !== expectedApiKey
  ) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: InitAgentBody }>(
    '/api/agents/init',
    {
      preHandler: verifyInternalApiKey,
      schema: {
        body: {
          type: 'object',
          required: ['user_id', 'api_key', 'api_key_prefix'],
          properties: {
            user_id: { type: 'string' },
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
        const { user_id, api_key, api_key_prefix } = request.body;

        const encryptionSecret = process.env.INTERNAL_API_KEY;
        if (!encryptionSecret) {
          throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const encryptedApiKey = encryptApiKey(api_key, encryptionSecret);

        const { error } = await adminSupabase
          .from('automation_agent_keys')
          .insert({
            user_id,
            encrypted_api_key: encryptedApiKey,
            api_key_prefix,
            is_active: true,
          });

        if (error) {
          reply.code(400).send({ error: error.message });
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
      preHandler: [fastify.authenticate],
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
          .from('automation_agent_keys')
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

        const encryptionSecret = process.env.INTERNAL_API_KEY;
        if (!encryptionSecret) {
          throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const apiKey = decryptApiKey(data.encrypted_api_key, encryptionSecret);

        reply.send({ api_key: apiKey });
      } catch (error: any) {
        reply
          .code(500)
          .send({ error: error.message || 'Failed to fetch API key' });
      }
    }
  );
}
