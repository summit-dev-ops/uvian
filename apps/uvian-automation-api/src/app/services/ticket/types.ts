import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  requesterJobId?: string;
  toolName?: string;
  toolCallId?: string;
  approveSubsequent?: boolean;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}

export interface TicketRecord {
  ticketId: string;
  status: string;
  title: string;
  description?: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  toolName?: string;
  toolCallId?: string;
  approveSubsequent?: boolean;
}

export interface ListTicketsFilters {
  status?: string;
  priority?: string;
}

export interface ListTicketsResult {
  tickets: TicketRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TicketScopedService {
  create(
    payload: CreateTicketPayload,
  ): Promise<{ ticketId: string; status: string }>;
  list(filters?: ListTicketsFilters): Promise<ListTicketsResult>;
  get(ticketId: string): Promise<TicketRecord | null>;
  update(ticketId: string, payload: UpdateTicketPayload): Promise<TicketRecord>;
  resolve(
    ticketId: string,
    resolutionPayload?: Record<string, unknown>,
  ): Promise<TicketRecord>;
  assign(ticketId: string, assignedTo: string | null): Promise<TicketRecord>;
  delete(ticketId: string): Promise<{ success: boolean }>;
}

export interface TicketAdminService {
  getById(ticketId: string): Promise<TicketRecord | null>;
}

export interface CreateTicketServiceConfig {}
