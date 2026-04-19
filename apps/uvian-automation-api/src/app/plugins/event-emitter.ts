import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  BaseEventEmitter,
  QueueService,
  Logger,
} from '@org/plugins-event-emitter';
import { queueService } from '../services';
import {
  SkillEvents,
  AgentEvents,
  TicketEvents,
  SkillCreatedData,
  SkillUpdatedData,
  SkillDeletedData,
  SkillLinkedData,
  SkillUnlinkedData,
  AgentCreatedData,
  AgentUpdatedData,
  AgentDeletedData,
  AgentActivatedData,
  AgentDeactivatedData,
  TicketResolvedData,
  TicketAssignedData,
  TicketCreatedData,
  TicketUpdatedData,
  TicketClosedData,
} from '@org/uvian-events';

function buildSourcePath(type: string, id: string): string {
  return `/${type}/${id}`;
}

export class AutomationEventEmitter extends BaseEventEmitter {
  emitSkillCreated(data: SkillCreatedData, actorId: string): void {
    const source = buildSourcePath('accounts', data.accountId);
    this.emit(SkillEvents.SKILL_CREATED, source, data, actorId);
  }

  emitSkillUpdated(data: SkillUpdatedData, actorId: string): void {
    const source = buildSourcePath('skills', data.skillId);
    this.emit(SkillEvents.SKILL_UPDATED, source, data, actorId);
  }

  emitSkillDeleted(data: SkillDeletedData, actorId: string): void {
    const source = '/skills';
    this.emit(SkillEvents.SKILL_DELETED, source, data, actorId);
  }

  emitSkillLinked(data: SkillLinkedData, actorId: string): void {
    const source = buildSourcePath('agents', data.agentId);
    this.emit(SkillEvents.SKILL_LINKED, source, data, actorId);
  }

  emitSkillUnlinked(data: SkillUnlinkedData, actorId: string): void {
    const source = buildSourcePath('agents', data.agentId);
    this.emit(SkillEvents.SKILL_UNLINKED, source, data, actorId);
  }

  emitAgentCreated(data: AgentCreatedData, actorId: string): void {
    const source = '/agents';
    this.emit(AgentEvents.AGENT_CREATED, source, data, actorId);
  }

  emitAgentUpdated(data: AgentUpdatedData, actorId: string): void {
    const source = buildSourcePath('agents', data.agentId);
    this.emit(AgentEvents.AGENT_UPDATED, source, data, actorId);
  }

  emitAgentDeleted(data: AgentDeletedData, actorId: string): void {
    const source = '/agents';
    this.emit(AgentEvents.AGENT_DELETED, source, data, actorId);
  }

  emitAgentActivated(data: AgentActivatedData, actorId: string): void {
    const source = buildSourcePath('agents', data.agentId);
    this.emit(AgentEvents.AGENT_ACTIVATED, source, data, actorId);
  }

  emitAgentDeactivated(data: AgentDeactivatedData, actorId: string): void {
    const source = buildSourcePath('agents', data.agentId);
    this.emit(AgentEvents.AGENT_DEACTIVATED, source, data, actorId);
  }

  emitTicketResolved(data: TicketResolvedData, actorId: string): void {
    const source = buildSourcePath('tickets', data.ticketId);
    this.emit(TicketEvents.TICKET_RESOLVED, source, data, actorId);
  }

  emitTicketAssigned(data: TicketAssignedData, actorId: string): void {
    const source = buildSourcePath('tickets', data.ticketId);
    this.emit(TicketEvents.TICKET_ASSIGNED, source, data, actorId);
  }

  emitTicketCreated(data: TicketCreatedData, actorId: string): void {
    const source = buildSourcePath('tickets', data.ticketId);
    this.emit(TicketEvents.TICKET_CREATED, source, data, actorId);
  }

  emitTicketUpdated(data: TicketUpdatedData, actorId: string): void {
    const source = buildSourcePath('tickets', data.ticketId);
    this.emit(TicketEvents.TICKET_UPDATED, source, data, actorId);
  }

  emitTicketClosed(data: TicketClosedData, actorId: string): void {
    const source = buildSourcePath('tickets', data.ticketId);
    this.emit(TicketEvents.TICKET_CLOSED, source, data, actorId);
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const log: Logger = {
    info: (obj, msg) => fastify.log.info(obj, msg),
    error: (obj, msg) => fastify.log.error(obj, msg),
  };

  const eventEmitter = new AutomationEventEmitter({
    queueService: queueService as unknown as QueueService,
    log,
  });
  fastify.decorate('eventEmitter', eventEmitter);
});

declare module 'fastify' {
  interface FastifyInstance {
    eventEmitter: AutomationEventEmitter;
  }
}
