import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const TicketEvents = {
  TICKET_CREATED: `${prefix}.ticket.ticket_created`,
  TICKET_UPDATED: `${prefix}.ticket.ticket_updated`,
  TICKET_RESOLVED: `${prefix}.ticket.ticket_resolved`,
  TICKET_CLOSED: `${prefix}.ticket.ticket_closed`,
  TICKET_ASSIGNED: `${prefix}.ticket.ticket_assigned`,
} as const;

export type TicketEventType = (typeof TicketEvents)[keyof typeof TicketEvents];

export interface TicketCreatedData {
  ticketId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
  spaceId?: string;
}

export interface TicketUpdatedData {
  ticketId: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  updatedBy: string;
}

export interface TicketResolvedData {
  ticketId: string;
  resolvedBy: string;
  approvalStatus: 'approved' | 'denied';
  reason?: string;
}

export interface TicketClosedData {
  ticketId: string;
  closedBy: string;
}

export interface TicketAssignedData {
  ticketId: string;
  assignedTo: string;
  assignedBy: string;
}

export type TicketEventData =
  | TicketCreatedData
  | TicketUpdatedData
  | TicketResolvedData
  | TicketClosedData
  | TicketAssignedData;
