export interface Ticket {
  id: string;
  threadId: string;
  resourceScopeId: string;
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
  spaceId?: string;
  conversationId?: string;
  scopeType?: 'space' | 'conversation';
  assignedProfile?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface CreateTicketRequest {
  Body: {
    threadId: string;
    resourceScopeId: string;
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
  spaceId?: string;
  conversationId?: string;
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
  scope?: {
    type: 'space' | 'conversation';
    id: string;
    name?: string;
  };
}

export interface CreateTicketResponse {
  ticketId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
  resourceScopeId: string;
  threadId: string;
  spaceId?: string;
  conversationId?: string;
}

export interface GetSpaceTicketsRequest {
  Params: {
    spaceId: string;
  };
  Querystring: {
    status?: Ticket['status'];
    priority?: Ticket['priority'];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
}

export interface GetConversationTicketsRequest {
  Params: {
    conversationId: string;
  };
  Querystring: {
    status?: Ticket['status'];
    priority?: Ticket['priority'];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
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
  Params?: {
    scopeType?: 'space' | 'conversation';
    scopeId?: string;
  };
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
