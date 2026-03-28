import { adminSupabase } from '../../clients/supabase.client';
import { jobService } from '../';
import {
  WebhookEnvelope,
  TicketEvents,
  TicketCreatedData,
  TicketUpdatedData,
} from '@org/uvian-events';

export function registerTicketHandlers(webhookHandler: any) {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };

  webhookHandler.registerHandler(
    TicketEvents.TICKET_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as TicketCreatedData;

      console.log('Ticket created:', {
        ticketId: payload.ticketId,
        priority: payload.priority,
        agentId,
      });

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'ticket.created',
          actor: { id: payload.createdBy, type: 'user' },
          resource: {
            type: 'ticket',
            id: payload.ticketId,
            data: {
              title: payload.title,
              description: payload.description,
              priority: payload.priority,
            },
          },
          context: { spaceId: payload.spaceId },
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    TicketEvents.TICKET_UPDATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as TicketUpdatedData;

      console.log('Ticket updated:', {
        ticketId: payload.ticketId,
        status: payload.status,
        agentId,
      });

      await jobService.scoped(clients).createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'ticket.updated',
          actor: { id: payload.updatedBy, type: 'user' },
          resource: {
            type: 'ticket',
            id: payload.ticketId,
            data: {
              status: payload.status,
              priority: payload.priority,
            },
          },
          context: {},
          agentId,
        },
      });
    }
  );
}
