import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebhookEnvelope, WebhookResponse } from '@org/uvian-events';
import { webhookHandlerService } from '../services/webhook-handler.service';

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: WebhookEnvelope }>(
    '/api/webhooks/events',
    {
      preHandler: [fastify.authenticateWebhook],
    },
    async (
      request: FastifyRequest<{ Body: WebhookEnvelope }>,
      reply: FastifyReply
    ) => {
      try {
        const result: WebhookResponse = await webhookHandlerService.handleEvent(
          request.body
        );

        if (result.message?.includes('already processed')) {
          return reply.code(200).send(result);
        }

        return reply.code(202).send(result);
      } catch (error: any) {
        fastify.log.error(error, 'Error processing webhook event');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process webhook event',
        });
      }
    }
  );

  fastify.get(
    '/api/webhooks/health',
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        status: 'ok',
        service: 'uvian-automation-api-webhooks',
      });
    }
  );
}
