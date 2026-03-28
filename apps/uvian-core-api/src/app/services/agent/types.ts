import type { ServiceClients } from '../types/service-clients';

export interface Agent {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreatedAgentResult extends Agent {
  apiKey: string;
}

export interface CreateAgentServiceConfig {
  apiKeyService: {
    scoped: (clients: ServiceClients) => {
      createApiKey: (
        userId: string,
        payload: { service: string }
      ) => Promise<{ apiKey: string; userId: string; service: string }>;
      revokeApiKey: (
        userId: string,
        service: string,
        apiKeyPrefix?: string
      ) => Promise<void>;
    };
  };
}

export interface AgentScopedService {
  getAgents(accountId: string): Promise<Agent[]>;
  getAgent(agentId: string, accountId: string): Promise<Agent | null>;
  createAgent(
    userId: string,
    accountId: string,
    name: string
  ): Promise<CreatedAgentResult>;
  deleteAgent(
    userId: string,
    agentId: string,
    accountId: string
  ): Promise<void>;
}

export interface AgentAdminService {
  getAgentById(agentId: string): Promise<Agent | null>;
  getAgentsByAccountId(accountId: string): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
}
