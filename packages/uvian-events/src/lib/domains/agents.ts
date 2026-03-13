import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const AgentEvents = {
  AGENT_CREATED: `${prefix}.agent.agent_created`,
  AGENT_UPDATED: `${prefix}.agent.agent_updated`,
  AGENT_DELETED: `${prefix}.agent.agent_deleted`,
  AGENT_ACTIVATED: `${prefix}.agent.agent_activated`,
  AGENT_DEACTIVATED: `${prefix}.agent.agent_deactivated`,
} as const;

export type AgentEventType = (typeof AgentEvents)[keyof typeof AgentEvents];

export interface AgentCreatedData {
  agentId: string;
  name: string;
  createdBy: string;
}

export interface AgentUpdatedData {
  agentId: string;
  updatedBy: string;
  name?: string;
  config?: Record<string, unknown>;
}

export interface AgentDeletedData {
  agentId: string;
  deletedBy: string;
}

export interface AgentActivatedData {
  agentId: string;
  activatedBy: string;
}

export interface AgentDeactivatedData {
  agentId: string;
  deactivatedBy: string;
}

export type AgentEventData =
  | AgentCreatedData
  | AgentUpdatedData
  | AgentDeletedData
  | AgentActivatedData
  | AgentDeactivatedData;
