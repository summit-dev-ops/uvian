import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IntakeService, CreateIntakeInput } from '../services/intake.service';
import {
  ApiKeyService,
  checkAccountMembership,
} from '../services/api-key.service';
import jwt from 'jsonwebtoken';

interface CreateIntakeBody {
  title: string;
  description?: string;
  submitLabel?: string;
  publicKey: string;
  schema: {
    fields: Array<{
      name: string;
      type: 'text' | 'password' | 'email' | 'select' | 'textarea';
      label: string;
      required?: boolean;
      options?: { value: string; label: string }[];
      placeholder?: string;
      secret?: boolean;
    }>;
  };
  metadata?: Record<string, unknown>;
  expiresInSeconds?: number;
  createdBy: string;
}

interface TokenIdParams {
  tokenId: string;
}

interface CreateApiKeyBody {
  userId: string;
}

interface RevokeApiKeyBody {
  userId: string;
  apiKeyPrefix?: string;
}

interface AuthContext {
  userId?: string;
  internalAuth: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    authContext?: AuthContext;
  }
}

async function verifyJwt(token: string): Promise<string | null> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    if (!decoded.sub || decoded.role !== 'authenticated') {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function internalV1Routes(fastify: FastifyInstance) {
  const intakeService = new IntakeService(fastify);

  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const internalKey = request.headers['x-internal-api-key'];
      const authHeader = request.headers.authorization;

      if (internalKey === process.env.INTERNAL_API_KEY) {
        request.authContext = { internalAuth: true };
        return;
      }

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const userId = await verifyJwt(token);
        if (userId) {
          request.authContext = { userId, internalAuth: false };
          return;
        }
      }

      return reply.code(401).send({ error: 'Unauthorized' });
    }
  );

  fastify.post<{ Body: CreateApiKeyBody }>(
    '/api/auth/api-key',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId: targetUserId } = request.body;
      const authContext = request.authContext!;

      if (!authContext.internalAuth && authContext.userId) {
        const hasAccess = await checkAccountMembership(
          authContext.userId,
          targetUserId
        );
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        const result = await ApiKeyService.createApiKey(
          targetUserId,
          'intake-api'
        );
        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error({ error }, 'Failed to create API key');
        return reply.code(500).send({ error: 'Failed to create API key' });
      }
    }
  );

  fastify.delete<{ Body: RevokeApiKeyBody }>(
    '/api/auth/api-key',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            apiKeyPrefix: { type: 'string', minLength: 16, maxLength: 16 },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId: targetUserId, apiKeyPrefix } = request.body;
      const authContext = request.authContext!;

      if (!authContext.internalAuth && authContext.userId) {
        const hasAccess = await checkAccountMembership(
          authContext.userId,
          targetUserId
        );
        if (!hasAccess) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Target user must be in the same account',
          });
        }
      }

      try {
        await ApiKeyService.revokeApiKey(
          targetUserId,
          'intake-api',
          apiKeyPrefix
        );
        return reply.send({ success: true });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to revoke API key');
        return reply.code(500).send({ error: 'Failed to revoke API key' });
      }
    }
  );

  fastify.post<{ Body: CreateIntakeBody }>(
    '/intakes',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title', 'schema', 'publicKey', 'createdBy'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 500 },
            description: { type: 'string', maxLength: 2000 },
            submitLabel: { type: 'string', maxLength: 100 },
            publicKey: { type: 'string', minLength: 1 },
            schema: {
              type: 'object',
              required: ['fields'],
              properties: {
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name', 'type', 'label'],
                    properties: {
                      name: { type: 'string' },
                      type: {
                        type: 'string',
                        enum: [
                          'text',
                          'password',
                          'email',
                          'select',
                          'textarea',
                        ],
                      },
                      label: { type: 'string' },
                      required: { type: 'boolean' },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            value: { type: 'string' },
                            label: { type: 'string' },
                          },
                        },
                      },
                      placeholder: { type: 'string' },
                      secret: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            metadata: { type: 'object' },
            expiresInSeconds: { type: 'number', minimum: 60, maximum: 604800 },
            createdBy: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input: CreateIntakeInput = {
          title: request.body.title,
          description: request.body.description,
          submitLabel: request.body.submitLabel,
          publicKey: request.body.publicKey,
          schema: request.body.schema,
          metadata: request.body.metadata,
          expiresInSeconds: request.body.expiresInSeconds,
          createdBy: request.body.createdBy,
        };

        const result = await intakeService.createIntake(input);
        return reply.code(201).send(result);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to create intake');
        return reply.code(500).send({ error: 'Failed to create intake' });
      }
    }
  );

  fastify.get<{ Params: TokenIdParams }>(
    '/intakes/:tokenId',
    async (request, reply) => {
      try {
        const { tokenId } = request.params;
        const result = await intakeService.getIntakeStatus(tokenId);

        if (!result) {
          return reply.code(404).send({ error: 'Intake not found' });
        }

        return reply.send(result);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to get intake');
        return reply.code(500).send({ error: 'Failed to get intake status' });
      }
    }
  );

  fastify.delete<{ Params: TokenIdParams }>(
    '/intakes/:tokenId',
    async (request, reply) => {
      try {
        const { tokenId } = request.params;
        const revoked = await intakeService.revokeIntake(tokenId);

        if (!revoked) {
          return reply
            .code(404)
            .send({ error: 'Intake not found or already processed' });
        }

        return reply.send({ success: true });
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to revoke intake');
        return reply.code(500).send({ error: 'Failed to revoke intake' });
      }
    }
  );
}
