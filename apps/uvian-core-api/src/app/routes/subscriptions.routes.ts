import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscriptionService } from '../services';
import { adminSupabase } from '../clients/supabase.client';

interface CreateSubscriptionBody {
  resource_type: string;
  resource_id: string;
  is_active?: boolean;
}

interface DeleteSubscriptionParams {
  subscriptionId: string;
}

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
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

        const clients = getClients(request);
        const subscriptions = await subscriptionService
          .scoped(clients)
          .getSubscriptionsByUser(userId);
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

        const clients = getClients(request);
        const subscription = await subscriptionService
          .scoped(clients)
          .createSubscription(userId, {
            resource_type: request.body.resource_type,
            resource_id: request.body.resource_id,
            is_active: request.body.is_active,
          });

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
        const clients = getClients(request);

        await subscriptionService
          .scoped(clients)
          .deleteSubscription(userId, subscriptionId);

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
