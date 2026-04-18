import {
  ServiceClients,
  TicketScopedService,
  CreateTicketPayload,
  UpdateTicketPayload,
  ListTicketsFilters,
  ListTicketsResult,
  TicketRecord,
} from './types';

export function createTicketScopedService(
  clients: ServiceClients,
): TicketScopedService {
  async function verifyTicketAccess(ticketId: string): Promise<void> {
    const { data, error } = await clients.userClient
      .schema('core_automation')
      .from('get_tickets_for_current_user')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (error || !data) throw new Error('Ticket not found or access denied');
  }

  return {
    async create(
      payload: CreateTicketPayload,
    ): Promise<{ ticketId: string; status: string; threadId: string }> {
      const insertData: Record<string, unknown> = {
        thread_id: payload.threadId,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority || 'medium',
        assigned_to: payload.assignedTo || null,
        requester_job_id: payload.requesterJobId || null,
      };

      if (payload.toolName) {
        insertData.tool_name = payload.toolName;
        insertData.status = 'pending';
      }
      if (payload.toolCallId) {
        insertData.tool_call_id = payload.toolCallId;
      }
      if (payload.approveSubsequent !== undefined) {
        insertData.approve_subsequent = payload.approveSubsequent;
      }

      const { data, error } = await clients.adminClient
        .schema('core_automation')
        .from('tickets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const ticketId = data.id;

      if (payload.toolName) {
        const { data: threadData } = await clients.adminClient
          .schema('core_automation')
          .from('process_threads')
          .select('user_id')
          .eq('id', payload.threadId)
          .single();

        if (threadData?.user_id) {
          await clients.adminClient.from('subscriptions').insert({
            id: `ticket_${ticketId}`,
            user_id: threadData.user_id,
            resource_type: 'uvian.ticket',
            resource_id: ticketId,
            is_active: true,
          });
        }
      }

      return {
        ticketId: data.id,
        status: data.status,
        threadId: data.thread_id,
      };
    },

    async list(filters: ListTicketsFilters = {}): Promise<ListTicketsResult> {
      let q = clients.userClient
        .schema('core_automation')
        .from('get_tickets_for_current_user')
        .select('*');

      if (filters.status) q = q.eq('status', filters.status);
      if (filters.priority) q = q.eq('priority', filters.priority);

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      return {
        tickets: (data || []).map(mapRow),
        total: data?.length || 0,
        page: 1,
        limit: 20,
        hasMore: false,
      };
    },

    async get(ticketId: string): Promise<TicketRecord | null> {
      const { data, error } = await clients.userClient
        .schema('core_automation')
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error || !data) throw new Error('Ticket not found');
      return mapRow(data);
    },

    async update(
      ticketId: string,
      payload: UpdateTicketPayload,
    ): Promise<TicketRecord> {
      await verifyTicketAccess(ticketId);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title) updateData.title = payload.title;
      if (payload.description) updateData.description = payload.description;
      if (payload.status) updateData.status = payload.status;
      if (payload.priority) updateData.priority = payload.priority;

      const { data: ticket, error } = await clients.adminClient
        .schema('core_automation')
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(ticket);
    },

    async resolve(
      ticketId: string,
      resolutionPayload: Record<string, unknown> = {},
    ): Promise<TicketRecord> {
      await verifyTicketAccess(ticketId);

      const { data: ticket, error } = await clients.adminClient
        .schema('core_automation')
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
      return mapRow(ticket);
    },

    async assign(
      ticketId: string,
      assignedTo: string | null,
    ): Promise<TicketRecord> {
      await verifyTicketAccess(ticketId);

      const { data: currentTicket } = await clients.adminClient
        .schema('core_automation')
        .from('tickets')
        .select('assigned_to')
        .eq('id', ticketId)
        .single();

      const previousAssignee = currentTicket?.assigned_to;

      const { data: ticket, error } = await clients.adminClient
        .schema('core_automation')
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

      if (assignedTo) {
        const existingSub = await clients.adminClient
          .from('subscriptions')
          .select('id')
          .eq('resource_type', 'uvian.ticket')
          .eq('resource_id', ticketId)
          .eq('user_id', assignedTo)
          .single();

        if (!existingSub) {
          await clients.adminClient.from('subscriptions').insert({
            id: `ticket_${ticketId}_assign_${assignedTo}`,
            user_id: assignedTo,
            resource_type: 'uvian.ticket',
            resource_id: ticketId,
            is_active: true,
          });
        }
      }

      if (previousAssignee && previousAssignee !== assignedTo) {
        await clients.adminClient
          .from('subscriptions')
          .delete()
          .eq('resource_type', 'uvian.ticket')
          .eq('resource_id', ticketId)
          .eq('user_id', previousAssignee);
      }

      return mapRow(ticket);
    },

    async delete(ticketId: string): Promise<{ success: boolean }> {
      await verifyTicketAccess(ticketId);

      const { error } = await clients.adminClient
        .schema('core_automation')
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw new Error('Cannot delete ticket');
      return { success: true };
    },
  };
}

function mapRow(row: unknown): TicketRecord {
  const r = row as Record<string, unknown>;
  return {
    ticketId: r.id as string,
    status: r.status as string,
    threadId: r.thread_id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    priority: r.priority as string,
    assignedTo: r.assigned_to as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    toolName: r.tool_name as string | undefined,
    toolCallId: r.tool_call_id as string | undefined,
    approveSubsequent: r.approve_subsequent as boolean | undefined,
  };
}
