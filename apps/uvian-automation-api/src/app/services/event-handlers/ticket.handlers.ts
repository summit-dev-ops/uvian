import { queueService } from '../queue.service';
import {
  WebhookEnvelope,
  TicketEvents,
  TicketCreatedData,
  TicketUpdatedData,
} from '@org/uvian-events';

export function registerTicketHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    TicketEvents.TICKET_CREATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as TicketCreatedData;

      console.log('Ticket created:', {
        ticketId: payload.ticketId,
        priority: payload.priority,
      });

      await queueService.addJob('main-queue', 'ticket.created', {
        eventId: envelope.id,
        ticketId: payload.ticketId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        createdBy: payload.createdBy,
        spaceId: payload.spaceId,
      });
    }
  );

  webhookHandler.registerHandler(
    TicketEvents.TICKET_UPDATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as TicketUpdatedData;

      console.log('Ticket updated:', {
        ticketId: payload.ticketId,
        status: payload.status,
      });

      await queueService.addJob('main-queue', 'ticket.updated', {
        eventId: envelope.id,
        ticketId: payload.ticketId,
        status: payload.status,
        priority: payload.priority,
        updatedBy: payload.updatedBy,
      });
    }
  );
}
