import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

export class TicketService {
  private async verifyTicketAccess(
    userClient: SupabaseClient,
    ticketId: string
  ) {
    const { data, error } = await userClient
      .from('get_tickets_for_current_user')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (error || !data) throw new Error('Ticket not found or access denied');
  }

  async createTicket(
    userClient: SupabaseClient,
    data: {
      threadId: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string;
      requesterJobId?: string;
    }
  ) {
    const { data: ticket, error } = await adminSupabase
      .from('core_automation.tickets')
      .insert({
        thread_id: data.threadId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        assigned_to: data.assignedTo || null,
        requester_job_id: data.requesterJobId || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      ticketId: ticket.id,
      status: ticket.status,
      threadId: ticket.thread_id,
    };
  }

  async listTickets(
    userClient: SupabaseClient,
    filters: { status?: string; priority?: string } = {}
  ) {
    let q = userClient.from('get_tickets_for_current_user').select('*');

    if (filters.status) q = q.eq('status', filters.status);
    if (filters.priority) q = q.eq('priority', filters.priority);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return {
      tickets: data || [],
      total: data?.length || 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  async getTicket(userClient: SupabaseClient, ticketId: string) {
    const { data, error } = await userClient
      .from('core_automation.tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !data) throw new Error('Ticket not found');
    return data;
  }

  async updateTicket(
    userClient: SupabaseClient,
    ticketId: string,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
    },
    _userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;

    const { data: ticket, error } = await adminSupabase
      .from('core_automation.tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return ticket;
  }

  async resolveTicket(
    userClient: SupabaseClient,
    ticketId: string,
    resolutionPayload: Record<string, any> = {},
    _userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const { data: ticket, error } = await adminSupabase
      .from('core_automation.tickets')
      .update({
        status: 'resolved',
        resolution_payload: resolutionPayload,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return ticket;
  }

  async assignTicket(
    userClient: SupabaseClient,
    ticketId: string,
    assignedTo: string | null,
    _userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const { data: ticket, error } = await adminSupabase
      .from('core_automation.tickets')
      .update({
        assigned_to: assignedTo,
        status: assignedTo ? 'in_progress' : 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return ticket;
  }

  async deleteTicket(
    userClient: SupabaseClient,
    ticketId: string,
    _userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const { error } = await adminSupabase
      .from('core_automation.tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw new Error('Cannot delete ticket');
    return { success: true };
  }
}

export const ticketService = new TicketService();
