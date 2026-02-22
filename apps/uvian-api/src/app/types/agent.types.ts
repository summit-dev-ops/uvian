import { Job } from './job.types';

// Agent-specific request/response types
export interface AgentThreadJobsRequest {
  Params: {
    threadId: string;
  };
  Querystring: {
    status?: Job['status'];
    page?: number;
    limit?: number;
  };
}

export interface AgentJobsWithTicketsRequest {
  Params: {
    threadId: string;
  };
}

// Agent process thread types (for future use)
export interface ProcessThread {
  id: string;
  profileId: string;
  resourceScopeId: string;
  currentStatus: 'active' | 'paused' | 'completed';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  spaceId?: string;
  conversationId?: string;
  scopeType?: 'space' | 'conversation';
}

export interface CreateAgentJobRequest {
  Body: {
    input: Record<string, any>;
    resourceScopeId: string;
    threadId?: string; // For resuming existing threads
    agentProfileId: string;
    isResume?: boolean;
    resolutionPayload?: Record<string, any>;
  };
}

export interface AgentJobInput {
  threadId?: string;
  agentProfileId: string;
  resourceScopeId: string;
  isResume?: boolean;
  resolutionPayload?: Record<string, any>;
  ticketId?: string;
  // Original job context for resume
  originalJobId?: string;
  checkpointData?: Record<string, any>;
}
