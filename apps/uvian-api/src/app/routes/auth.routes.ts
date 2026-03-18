import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface GetJwtRequest {
  Body: {
    api_key: string;
  };
}

interface JwtResponse {
  jwt: string;
  expires_in: number;
  user_id: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<GetJwtRequest>(
    '/api/auth/get-jwt',
    {
      schema: {
        body: {
          type: 'object',
          required: ['api_key'],
          properties: {
            api_key: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetJwtRequest>,
      reply: FastifyReply
    ): Promise<void> => {
      try {
        const { api_key } = request.body;

        if (!api_key || !api_key.startsWith('sk_agent_')) {
          reply.code(401).send({ error: 'Invalid API key format' });
          return;
        }

        const apiKeyPrefix = api_key.substring(0, 16);

        const { data: apiKeyRecord, error: apiKeyError } = await adminSupabase
          .from('agent_api_keys')
          .select('id, user_id, api_key_hash, is_active')
          .eq('api_key_prefix', apiKeyPrefix)
          .eq('is_active', true)
          .single();

        if (apiKeyError || !apiKeyRecord) {
          reply.code(401).send({ error: 'Invalid API key' });
          return;
        }

        const isValid = await bcrypt.compare(
          api_key,
          apiKeyRecord.api_key_hash
        );
        if (!isValid) {
          reply.code(401).send({ error: 'Invalid API key' });
          return;
        }

        const { data: userData, error: userError } =
          await adminSupabase.auth.admin.getUserById(apiKeyRecord.user_id);

        if (userError || !userData.user) {
          reply.code(404).send({ error: 'Agent user not found' });
          return;
        }

        const userId = userData.user.id;
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;

        if (!jwtSecret) {
          reply.code(500).send({ error: 'JWT_SECRET not configured' });
          return;
        }

        const payload = {
          aud: 'authenticated',
          role: 'authenticated',
          sub: userId,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          iss: 'supabase',
        };

        const workerJwt = jwt.sign(payload, jwtSecret, {
          algorithm: 'HS256',
        });

        const response: JwtResponse = {
          jwt: workerJwt,
          expires_in: 3600,
          user_id: apiKeyRecord.user_id,
        };

        reply.send(response);
      } catch (error: any) {
        reply
          .code(500)
          .send({ error: error.message || 'Failed to generate JWT' });
      }
    }
  );
}
