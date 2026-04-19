import {
  ServiceClients,
  TicketRecord,
  CreateTicketPayload,
  UpdateTicketPayload,
  ticketService,
} from '../../services/ticket';
import type { CommandContext } from '../types';
import {
  TicketAssignedData,
  TicketResolvedData,
  TicketCreatedData,
  TicketUpdatedData,
  TicketClosedData,
} from '@org/uvian-events';

export interface CreateTicketCommandInput extends CreateTicketPayload {
  userId: string;
}

export interface CreateTicketCommandOutput {
  ticket: { ticketId: string; status: string; threadId: string };
}

export async function createTicket(
  clients: ServiceClients,
  input: CreateTicketCommandInput,
  context?: CommandContext,
): Promise<CreateTicketCommandOutput> {
  const { userId, ...payload } = input;

  const result = await ticketService.scoped(clients).create(payload);

  if (context?.eventEmitter) {
    context.eventEmitter.emitTicketCreated(
      {
        ticketId: result.ticketId,
        title: payload.title || '',
        description: payload.description || '',
        priority: payload.priority || 'medium',
        createdBy: userId,
      } as TicketCreatedData,
      userId,
    );
  }

  return { ticket: result };
}

export interface UpdateTicketCommandInput {
  ticketId: string;
  userId: string;
  updates: UpdateTicketPayload;
}

export interface UpdateTicketCommandOutput {
  ticket: TicketRecord;
}

export async function updateTicket(
  clients: ServiceClients,
  input: UpdateTicketCommandInput,
  context?: CommandContext,
): Promise<UpdateTicketCommandOutput> {
  const { ticketId, userId, updates } = input;

  const ticket = await ticketService.scoped(clients).update(ticketId, updates);

  if (context?.eventEmitter) {
    context.eventEmitter.emitTicketUpdated(
      {
        ticketId,
        status: ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: ticket.priority as 'low' | 'medium' | 'high' | 'critical',
        updatedBy: userId,
      } as TicketUpdatedData,
      userId,
    );
  }

  return { ticket };
}

export interface ResolveTicketCommandInput {
  ticketId: string;
  userId: string;
  resolutionPayload?: Record<string, unknown>;
}

export interface ResolveTicketCommandOutput {
  ticket: TicketRecord;
}

export async function resolveTicket(
  clients: ServiceClients,
  input: ResolveTicketCommandInput,
  context?: CommandContext,
): Promise<ResolveTicketCommandOutput> {
  const { ticketId, userId, resolutionPayload } = input;

  const ticket = await ticketService
    .scoped(clients)
    .resolve(ticketId, resolutionPayload || {});

  if (context?.eventEmitter) {
    const resolvedPayload = resolutionPayload || {};
    context.eventEmitter.emitTicketResolved(
      {
        ticketId,
        resolvedBy: userId,
        threadId: ticket.threadId,
        toolName: ticket.toolName,
        toolCallId: ticket.toolCallId,
        approvalStatus: resolvedPayload?.approved ? 'approved' : 'denied',
        reason: resolvedPayload?.reason as string | undefined,
      } as TicketResolvedData,
      userId,
    );
  }

  return { ticket };
}

export interface AssignTicketCommandInput {
  ticketId: string;
  assignedTo: string | null;
  assignedBy: string;
}

export interface AssignTicketCommandOutput {
  ticket: TicketRecord;
}

export async function assignTicket(
  clients: ServiceClients,
  input: AssignTicketCommandInput,
  context?: CommandContext,
): Promise<AssignTicketCommandOutput> {
  const { ticketId, assignedTo, assignedBy } = input;

  const ticket = await ticketService
    .scoped(clients)
    .assign(ticketId, assignedTo);

  if (context?.eventEmitter && assignedTo) {
    context.eventEmitter.emitTicketAssigned(
      {
        ticketId,
        assignedTo,
        assignedBy,
      } as TicketAssignedData,
      assignedBy,
    );
  }

  return { ticket };
}

export interface DeleteTicketCommandInput {
  ticketId: string;
  userId: string;
}

export interface DeleteTicketCommandOutput {
  success: boolean;
}

export async function deleteTicket(
  clients: ServiceClients,
  input: DeleteTicketCommandInput,
  context?: CommandContext,
): Promise<DeleteTicketCommandOutput> {
  const { ticketId, userId } = input;

  await ticketService.scoped(clients).delete(ticketId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitTicketClosed(
      {
        ticketId,
        closedBy: userId,
      } as TicketClosedData,
      userId,
    );
  }

  return { success: true };
}
