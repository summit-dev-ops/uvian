import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscriptionService } from '../services/subscription.service';
import { createUserClient } from '../clients/supabase.client';

interface CreateSubscriptionBody {
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

interface DeleteSubscriptionParams {
  subscriptionId: string;
}

function getUserClient(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  return createUserClient(token);
}

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/subscriptions',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const userClient = getUserClient(request);
        const subscriptions = await subscriptionService.getSubscriptionsByUser(
          userClient,
          userId
        );
        reply.send({ subscriptions });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch subscriptions' });
      }
    }
  );

  fastify.post<{ Body: CreateSubscriptionBody }>(
    '/api/subscriptions',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['resource_type', 'resource_id'],
          properties: {
            resource_type: {
              type: 'string',
              enum: [
                'conversation',
                'space',
                'ticket',
                'job',
                'agent',
                'intake',
                'submission',
              ],
            },
            resource_id: { type: 'string', format: 'uuid' },
            is_active: { type: 'boolean', default: true },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateSubscriptionBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const userClient = getUserClient(request);
        const subscription = await subscriptionService.createSubscription(
          userClient,
          userId,
          {
            resource_type: request.body.resource_type,
            resource_id: request.body.resource_id,
            is_active: request.body.is_active,
          }
        );

        fastify.eventEmitter.emitSubscriptionCreated(
          {
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            resourceType: subscription.resource_type,
            resourceId: subscription.resource_id,
          },
          userId
        );

        reply.send({ subscription });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create subscription' });
      }
    }
  );

  fastify.delete<{ Params: DeleteSubscriptionParams }>(
    '/api/subscriptions/:subscriptionId',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: DeleteSubscriptionParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { subscriptionId } = request.params;
        const userClient = getUserClient(request);

        await subscriptionService.deleteSubscription(
          userClient,
          userId,
          subscriptionId
        );

        fastify.eventEmitter.emitSubscriptionDeleted(
          { subscriptionId, userId },
          userId
        );

        reply.code(204).send();
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to delete subscription' });
      }
    }
  );
}
