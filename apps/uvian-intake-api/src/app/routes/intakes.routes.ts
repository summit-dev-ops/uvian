import { FastifyInstance } from 'fastify';
import { intakeService } from '../services';
import { adminSupabase } from '../clients/supabase.client';
import { createIntake, revokeIntake } from '../commands';

interface TokenIdParams {
  tokenId: string;
}

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
  requiresAuth?: boolean;
}

function getClients() {
  return {
    adminClient: adminSupabase,
    userClient: adminSupabase,
  };
}

export default async function intakesRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateIntakeBody }>(
    '/intakes',
    {
      preHandler: [fastify.authenticateInternal],
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
            requiresAuth: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as CreateIntakeBody;
        const clients = getClients();

        const { result } = await createIntake(clients, body, {
          eventEmitter: fastify.eventEmitter as any,
        });

        return reply.code(201).send(result);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to create intake');
        return reply.code(500).send({ error: 'Failed to create intake' });
      }
    },
  );

  fastify.get<{ Params: TokenIdParams }>(
    '/intakes/:tokenId',
    async (request, reply) => {
      try {
        const { tokenId } = request.params as TokenIdParams;
        const clients = getClients();
        const result = await intakeService
          .scoped(clients)
          .getIntakeStatus(tokenId);

        if (!result) {
          return reply.code(404).send({ error: 'Intake not found' });
        }

        return reply.send(result);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to get intake');
        return reply.code(500).send({ error: 'Failed to get intake status' });
      }
    },
  );

  fastify.delete<{ Params: TokenIdParams }>(
    '/intakes/:tokenId',
    async (request, reply) => {
      try {
        const { tokenId } = request.params as TokenIdParams;
        const { userId } = request.query as { userId?: string };

        if (!userId) {
          return reply.code(400).send({ error: 'userId is required' });
        }

        const clients = getClients();
        const { success } = await revokeIntake(
          clients,
          { tokenId, userId },
          { eventEmitter: fastify.eventEmitter as any },
        );

        if (!success) {
          return reply
            .code(404)
            .send({ error: 'Intake not found or already processed' });
        }

        return reply.send({ success: true });
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to revoke intake');
        return reply.code(500).send({ error: 'Failed to revoke intake' });
      }
    },
  );
}
