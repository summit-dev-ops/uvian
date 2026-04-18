import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase } from '../clients/supabase.client';
import { ticketService } from '../services';
import {
  CreateTicketRequest,
  GetTicketsRequest,
  GetTicketRequest,
  UpdateTicketRequest,
  DeleteTicketRequest,
} from '../types/ticket.types';
import { TicketResolvedData, TicketAssignedData } from '@org/uvian-events';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateTicketRequest>(
    '/api/tickets',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['threadId', 'title'],
          properties: {
            threadId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            assignedTo: { type: 'string' },
            requesterJobId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateTicketRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const body = request.body || {};
        const {
          threadId,
          title,
          description,
          priority,
          assignedTo,
          requesterJobId,
        } = body;

        if (!threadId || !title) {
          reply.code(400).send({
            error: 'threadId and title are required',
          });
          return;
        }

        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const result = await ticketService.scoped(clients).create({
          threadId,
          title,
          description,
          priority,
          assignedTo,
          requesterJobId,
        });

        reply.code(201).send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create ticket' });
      }
    },
  );

  fastify.get<GetTicketsRequest>(
    '/api/tickets',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<GetTicketsRequest>, reply: FastifyReply) => {
      try {
        const query = request.query || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const result = await ticketService.scoped(clients).list({
          status: query.status,
          priority: query.priority,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch tickets' });
      }
    },
  );

  fastify.get<GetTicketRequest>(
    '/api/tickets/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetTicketRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const ticket = await ticketService.scoped(clients).get(id);

        reply.send(ticket);
      } catch (error: any) {
        if (error.message === 'Ticket not found') {
          reply.code(404).send({ error: 'Ticket not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch ticket' });
        }
      }
    },
  );

  fastify.patch<UpdateTicketRequest>(
    '/api/tickets/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' },
            priority: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateTicketRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const updates = request.body || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const ticket = await ticketService.scoped(clients).update(id, updates);

        reply.send(ticket);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to update ticket' });
      }
    },
  );

  fastify.post<{
    Params: { id: string };
    Body: { resolutionPayload?: Record<string, any> };
  }>(
    '/api/tickets/:id/resolve',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { resolutionPayload?: Record<string, any> };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const body = request.body || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const ticket = await ticketService
          .scoped(clients)
          .resolve(id, body.resolutionPayload || {});

        if (ticket) {
          const resolvedPayload = body.resolutionPayload || {};
          const eventData: TicketResolvedData = {
            ticketId: id,
            resolvedBy: userId,
            threadId: ticket.threadId,
            toolName: ticket.toolName,
            toolCallId: ticket.toolCallId,
            approvalStatus: resolvedPayload?.approved ? 'approved' : 'denied',
            reason: resolvedPayload?.reason as string | undefined,
          };
          request.server.eventEmitter.emitTicketResolved(eventData, userId);
        }

        reply.send(ticket);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to resolve ticket' });
      }
    },
  );

  fastify.post<{ Params: { id: string }; Body: { assignedTo?: string } }>(
    '/api/tickets/:id/assign',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            assignedTo: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { assignedTo?: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const { assignedTo } = request.body || {};

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        const ticket = await ticketService
          .scoped(clients)
          .assign(id, assignedTo ?? null);

        if (assignedTo && ticket) {
          request.server.eventEmitter.emitTicketAssigned(
            {
              ticketId: id,
              assignedTo,
              assignedBy: userId,
            } as TicketAssignedData,
            userId,
          );
        }

        reply.send(ticket);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to assign ticket' });
      }
    },
  );

  fastify.delete<DeleteTicketRequest>(
    '/api/tickets/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteTicketRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;

        const clients = {
          adminClient: adminSupabase,
          userClient: request.supabase,
        };
        await ticketService.scoped(clients).delete(id);

        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to delete ticket' });
      }
    },
  );
}
