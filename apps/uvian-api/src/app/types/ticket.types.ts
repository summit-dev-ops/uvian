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
  // Enhanced fields for UI context (populated via joins)
  spaceId?: string; // The space this ticket operates in
  conversationId?: string; // The conversation this ticket operates in
  scopeType?: 'space' | 'conversation'; // Type of resource scope
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
  // Optional context information
  scope?: {
    type: 'space' | 'conversation';
    id: string;
    name?: string; // Space name or conversation title
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

// Specific request types for scoped ticket operations
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

// Enhanced ticket metrics that can be scoped to spaces or conversations
export interface TicketMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  averageResolutionTime?: number; // in milliseconds
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

// Missing interface exports for routes
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
