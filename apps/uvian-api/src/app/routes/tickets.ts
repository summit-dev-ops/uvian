import { FastifyInstance } from 'fastify';
import { ticketService } from '../services/ticket.service';
import { profileService } from '../services/profile.service';
import {
  CreateTicketRequest,
  CreateTicketResponse,
  GetTicketRequest,
  GetTicketsRequest,
  TicketFilters,
  PaginationOptions,
  UpdateTicketRequest,
  ResolveTicketRequest,
  AssignTicketRequest,
} from '../types/ticket.types';

export default async function (fastify: FastifyInstance) {
  // Create ticket with resource scope support
  fastify.post<CreateTicketRequest>('/api/tickets', {
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
      },
      response: {
        201: {
          type: 'object',
          properties: {
            ticketId: { type: 'string' },
            status: { type: 'string' },
            resourceScopeId: { type: 'string' },
            threadId: { type: 'string' },
            spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            conversationId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const payload = request.body as CreateTicketRequest['Body'];

        // Validate request
        if (!payload.threadId || !payload.resourceScopeId || !payload.title) {
          reply.code(400).send({
            error: 'threadId, resourceScopeId, and title are required',
          });
          return;
        }

        // Create ticket in database
        const ticket = await ticketService.createTicket(
          request.supabase,
          authProfileId,
          {
            threadId: payload.threadId,
            resourceScopeId: payload.resourceScopeId,
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            assignedTo: payload.assignedTo,
            requesterJobId: payload.requesterJobId,
          }
        );

        const response: CreateTicketResponse = {
          ticketId: ticket.id,
          status: ticket.status,
          resourceScopeId: ticket.resourceScopeId,
          threadId: ticket.threadId,
          spaceId: ticket.spaceId,
          conversationId: ticket.conversationId,
        };

        reply.code(201).send(response);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // List tickets with filtering and pagination
  fastify.get<GetTicketsRequest>('/api/tickets', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const query = request.query as TicketFilters & PaginationOptions;

      const page = query.page || 1;
      const limit = query.limit || 20;

      const result = await ticketService.listTickets(
        request.supabase,
        {
          status: query.status,
          priority: query.priority,
          threadId: query.threadId,
          spaceId: query.spaceId,
          conversationId: query.conversationId,
          assignedTo: query.assignedTo,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        },
        { page, limit }
      );

      reply.send(result);
    },
  });

  // Get single ticket
  fastify.get<GetTicketRequest>('/api/tickets/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const ticket = await ticketService.getTicket(request.supabase, id);
        reply.send(ticket);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            reply.code(404).send({ error: error.message });
          } else if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Update ticket
  fastify.patch('/api/tickets/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as {id:any};
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const updates = request.body as UpdateTicketRequest;

        const ticket = await ticketService.updateTicket(
          request.supabase,
          id,
          authProfileId,
          updates
        );

        reply.send(ticket);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Resolve ticket
  fastify.post('/api/tickets/:id/resolve', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as {id:any};
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const payload = request.body as ResolveTicketRequest;

        const ticket = await ticketService.resolveTicket(
          request.supabase,
          id,
          authProfileId,
          payload.resolutionPayload
        );

        reply.send(ticket);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Assign ticket
  fastify.post('/api/tickets/:id/assign', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as {id:any};
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );
        const payload = request.body as AssignTicketRequest;

        const ticket = await ticketService.assignTicket(
          request.supabase,
          id,
          authProfileId,
          payload.assignedTo
        );

        reply.send(ticket);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Delete ticket
  fastify.delete('/api/tickets/:id', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as {id:any};
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        await ticketService.deleteTicket(request.supabase, id, authProfileId);
        reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });
}
