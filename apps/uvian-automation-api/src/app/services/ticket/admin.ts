import { ServiceClients, TicketAdminService, TicketRecord } from './types';

export function createTicketAdminService(
  _clients: ServiceClients
): TicketAdminService {
  return {
    async getById(_ticketId: string): Promise<TicketRecord | null> {
      return null;
    },
  };
}
