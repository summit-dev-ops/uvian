import { createTicketScopedService } from './scoped';
import { createTicketAdminService } from './admin';
import {
  ServiceClients,
  TicketScopedService,
  TicketAdminService,
  CreateTicketServiceConfig,
} from './types';

export function createTicketService(_config: CreateTicketServiceConfig): {
  scoped: (clients: ServiceClients) => TicketScopedService;
  admin: (clients: ServiceClients) => TicketAdminService;
} {
  return {
    scoped: (clients: ServiceClients) => createTicketScopedService(clients),
    admin: (clients: ServiceClients) => createTicketAdminService(clients),
  };
}

export const ticketService = createTicketService({});

export type {
  ServiceClients,
  TicketScopedService,
  TicketAdminService,
  CreateTicketServiceConfig,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketRecord,
  ListTicketsFilters,
  ListTicketsResult,
} from './types';
