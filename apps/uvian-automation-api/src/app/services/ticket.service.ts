import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

export class TicketService {
  private async verifyResourceScopeAccess(
    userClient: SupabaseClient,
    resourceScopeId: string
  ) {
    const { data: scope } = await userClient
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', resourceScopeId)
      .single();

    if (!scope) throw new Error('Resource scope not found');

    if (scope.space_id) {
      const { data: member } = await userClient
        .from('space_members')
        .select('id')
        .eq('space_id', scope.space_id)
        .single();
      if (!member) throw new Error('Not a member of this space');
    } else if (scope.conversation_id) {
      const { data: member } = await userClient
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', scope.conversation_id)
        .single();
      if (!member) throw new Error('Not a member of this conversation');
    }
  }

  private async verifyTicketAccess(
    userClient: SupabaseClient,
    ticketId: string
  ) {
    const { data, error } = await userClient
      .from('get_ticket_details')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (error || !data) throw new Error('Ticket not found or access denied');
  }

  private async verifyCanManageTicket(
    userClient: SupabaseClient,
    ticketId: string,
    userId: string
  ) {
    const { data: ticket } = await userClient
      .from('get_ticket_details')
      .select('id, space_id, conversation_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) throw new Error('Ticket not found or access denied');

    if (ticket.space_id) {
      const { data: membership } = await userClient
        .from('space_members')
        .select('role')
        .eq('space_id', ticket.space_id)
        .eq('user_id', userId)
        .single();

      const role = membership?.role?.name;
      if (role !== 'owner' && role !== 'admin') {
        throw new Error('Only admins or owners can manage tickets');
      }
    } else if (ticket.conversation_id) {
      const { data: membership } = await userClient
        .from('conversation_members')
        .select('role')
        .eq('conversation_id', ticket.conversation_id)
        .eq('user_id', userId)
        .single();

      const role = membership?.role?.name;
      if (role !== 'owner') {
        throw new Error('Only conversation owners can manage tickets');
      }
    }
  }

  async createTicket(
    userClient: SupabaseClient,
    data: {
      threadId: string;
      resourceScopeId: string;
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string;
      requesterJobId?: string;
    }
  ) {
    await this.verifyResourceScopeAccess(userClient, data.resourceScopeId);

    const { data: ticket, error } = await adminSupabase
      .from('tickets')
      .insert({
        thread_id: data.threadId,
        resource_scope_id: data.resourceScopeId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'medium',
        assigned_to: data.assignedTo || null,
        requester_job_id: data.requesterJobId || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { data: scope } = await adminSupabase
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', data.resourceScopeId)
      .single();

    return {
      ticketId: ticket.id,
      status: ticket.status,
      resourceScopeId: ticket.resource_scope_id,
      threadId: ticket.thread_id,
      spaceId: scope?.space_id,
      conversationId: scope?.conversation_id,
    };
  }

  async listTickets(
    userClient: SupabaseClient,
    filters: {
      status?: string;
      priority?: string;
      spaceId?: string;
      conversationId?: string;
    } = {}
  ) {
    let q = userClient.from('get_tickets_for_current_user').select('*');

    if (filters.status) q = q.eq('status', filters.status);
    if (filters.priority) q = q.eq('priority', filters.priority);
    if (filters.spaceId) q = q.eq('space_id', filters.spaceId);
    if (filters.conversationId)
      q = q.eq('conversation_id', filters.conversationId);

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
      .from('get_ticket_details')
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
    userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;

    const { data: ticket, error } = await adminSupabase
      .from('tickets')
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
    userId: string
  ) {
    await this.verifyTicketAccess(userClient, ticketId);

    const { data: ticket, error } = await adminSupabase
      .from('tickets')
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
    userId: string
  ) {
    await this.verifyCanManageTicket(userClient, ticketId, userId);

    const { data: ticket, error } = await adminSupabase
      .from('tickets')
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
    userId: string
  ) {
    await this.verifyCanManageTicket(userClient, ticketId, userId);

    const { error } = await adminSupabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw new Error('Cannot delete ticket');
    return { success: true };
  }
}

export const ticketService = new TicketService();
