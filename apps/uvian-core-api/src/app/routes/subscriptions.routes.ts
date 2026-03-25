import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscriptionService } from '../services/subscription.service';

interface CreateSubscriptionBody {
  resource_type: string;
  resource_id: string;
  provider_id: string;
}

interface DeleteSubscriptionParams {
  subscriptionId: string;
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

        const subscriptions = await subscriptionService.getSubscriptionsByUser(
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
          required: ['resource_type', 'resource_id', 'provider_id'],
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
            provider_id: { type: 'string', format: 'uuid' },
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

        const subscription = await subscriptionService.createSubscription(
          userId,
          {
            ...request.body,
            user_id: userId,
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

        const existing = await subscriptionService.getSubscriptionById(
          subscriptionId
        );
        if (!existing) {
          reply.code(404).send({ error: 'Subscription not found' });
          return;
        }

        if (existing.user_id !== userId) {
          reply
            .code(403)
            .send({ error: 'Not authorized to delete this subscription' });
          return;
        }

        await subscriptionService.deleteSubscription(subscriptionId, userId);

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
