import fp from 'fastify-plugin';
import { createLlmService } from '../services/llm';
import { createMcpService } from '../services/mcp';
import { createSkillService } from '../services/skill';
import { createAgentConfigService } from '../services/agent-config';
import type { AutomationEventEmitter } from './event-emitter';

const llmService = createLlmService({});
const mcpService = createMcpService({});
const skillService = createSkillService();
const agentConfigService = createAgentConfigService({});

export interface Services {
  llm: ReturnType<typeof createLlmService>;
  mcp: ReturnType<typeof createMcpService>;
  skill: ReturnType<typeof createSkillService>;
  agentConfig: ReturnType<typeof createAgentConfigService>;
  eventEmitter: AutomationEventEmitter;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('services', {
    llm: llmService,
    mcp: mcpService,
    skill: skillService,
    agentConfig: agentConfigService,
    eventEmitter: fastify.eventEmitter,
  });
});
