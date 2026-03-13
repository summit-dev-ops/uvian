import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ticketService } from '../services/ticket.service';
import {
  CreateTicketRequest,
  GetTicketsRequest,
  GetTicketRequest,
  UpdateTicketRequest,
  DeleteTicketRequest,
} from '../types/ticket.types';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateTicketRequest>(
    '/api/tickets',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['threadId', 'resourceScopeId', 'title'],
          properties: {
            threadId: { type: 'string' },
            resourceScopeId: { type: 'string' },
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
      reply: FastifyReply
    ) => {
      try {
        const body = request.body || {};
        const {
          threadId,
          resourceScopeId,
          title,
          description,
          priority,
          assignedTo,
          requesterJobId,
        } = body;

        if (!threadId || !resourceScopeId || !title) {
          reply.code(400).send({
            error: 'threadId, resourceScopeId, and title are required',
          });
          return;
        }

        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const result = await ticketService.createTicket(request.supabase, {
          threadId,
          resourceScopeId,
          title,
          description,
          priority,
          assignedTo,
          requesterJobId,
        });

        fastify.services.eventEmitter.emitTicketCreated(
          {
            ticketId: result.ticketId,
            title,
            description: description || '',
            priority: priority || 'medium',
            createdBy: userId,
          },
          userId
        );

        reply.code(201).send(result);
      } catch (error: any) {
        if (error.message.includes('Not a member')) {
          reply
            .code(403)
            .send({ error: 'Not a member of this space or conversation' });
        } else {
          reply.code(400).send({ error: 'Failed to create ticket' });
        }
      }
    }
  );

  fastify.get<GetTicketsRequest>(
    '/api/tickets',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<GetTicketsRequest>, reply: FastifyReply) => {
      try {
        const query = request.query || {};

        const result = await ticketService.listTickets(request.supabase, {
          status: query.status,
          priority: query.priority,
          spaceId: query.spaceId,
          conversationId: query.conversationId,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch tickets' });
      }
    }
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

        const ticket = await ticketService.getTicket(request.supabase, id);

        reply.send(ticket);
      } catch (error: any) {
        if (error.message === 'Ticket not found') {
          reply.code(404).send({ error: 'Ticket not found' });
        } else if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch ticket' });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const updates = request.body || {};

        const ticket = await ticketService.updateTicket(
          request.supabase,
          id,
          updates,
          userId
        );

        fastify.services.eventEmitter.emitTicketUpdated(
          {
            ticketId: id,
            status: updates.status,
            priority: updates.priority,
            updatedBy: userId,
          },
          userId
        );

        reply.send(ticket);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to update ticket' });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const body = request.body || {};

        const ticket = await ticketService.resolveTicket(
          request.supabase,
          id,
          body.resolutionPayload || {},
          userId
        );

        fastify.services.eventEmitter.emitTicketResolved(
          { ticketId: id, resolvedBy: userId },
          userId
        );

        reply.send(ticket);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to resolve ticket' });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;
        const { assignedTo } = request.body || {};

        const ticket = await ticketService.assignTicket(
          request.supabase,
          id,
          assignedTo ?? null,
          userId
        );

        fastify.services.eventEmitter.emitTicketAssigned(
          { ticketId: id, assignedTo: assignedTo || '', assignedBy: userId },
          userId
        );

        reply.send(ticket);
      } catch (error: any) {
        if (
          error.message.includes('Only admins') ||
          error.message.includes('Only conversation owners')
        ) {
          reply.code(403).send({
            error: 'Only admins or conversation owners can assign tickets',
          });
        } else if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to assign ticket' });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { id } = request.params;

        await ticketService.deleteTicket(request.supabase, id, userId);

        reply.code(204).send();
      } catch (error: any) {
        if (
          error.message.includes('Only admins') ||
          error.message.includes('Only conversation owners')
        ) {
          reply.code(403).send({
            error: 'Only admins or conversation owners can delete tickets',
          });
        } else if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to delete ticket' });
        }
      }
    }
  );
}
