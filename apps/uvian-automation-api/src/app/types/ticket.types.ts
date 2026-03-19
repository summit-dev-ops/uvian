export interface Ticket {
  id: string;
  threadId: string | null;
  requesterJobId: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  resolutionPayload: Record<string, any> | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  assignedProfile?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface CreateTicketRequest {
  Body: {
    threadId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string;
    requesterJobId?: string;
  };
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string | null;
  resolutionPayload?: Record<string, any> | null;
}

export interface TicketFilters {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  threadId?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateTicketResponse {
  ticketId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  threadId: string;
}

export interface TicketMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  averageResolutionTime?: number;
}

export interface GetTicketMetricsRequest {
  Querystring: {
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface ResolveTicketRequest {
  resolutionPayload: Record<string, any>;
}

export interface AssignTicketRequest {
  assignedTo: string;
}

export interface GetTicketRequest {
  Params: {
    id: string;
  };
}

export interface GetTicketsRequest {
  Querystring: TicketFilters & PaginationOptions;
}

export interface UpdateTicketRequest {
  Params: {
    id: string;
  };
  Body: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  };
}

export interface DeleteTicketRequest {
  Params: {
    id: string;
  };
}
