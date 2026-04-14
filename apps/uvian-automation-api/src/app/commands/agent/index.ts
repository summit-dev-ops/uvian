import {
  ServiceClients,
  CreateAgentConfigPayload,
  AgentConfigRecord,
  LinkLlmPayload,
  LinkMcpPayload,
} from '../../services/agent-config/types';
import { createAgentConfigService } from '../../services/agent-config';
import type { CommandContext } from '../types';

const agentConfigService = createAgentConfigService({});

export interface CreateAgentCommandInput extends CreateAgentConfigPayload {}

export interface CreateAgentCommandOutput {
  agent: AgentConfigRecord;
}

export async function createAgent(
  clients: ServiceClients,
  input: CreateAgentCommandInput,
  context?: CommandContext,
): Promise<CreateAgentCommandOutput> {
  const agent = await agentConfigService.scoped(clients).create(input);

  if (context?.eventEmitter) {
    context.eventEmitter.emitAgentCreated(
      {
        agentId: agent.id,
        name: agent.accountId,
        createdBy: input.userId,
      },
      input.userId,
    );
  }

  return { agent };
}

export interface UpdateAgentCommandInput {
  agentId: string;
  userId: string;
  systemPrompt?: string;
  maxConversationHistory?: number;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateAgentCommandOutput {
  agent: AgentConfigRecord;
}

export async function updateAgent(
  clients: ServiceClients,
  input: UpdateAgentCommandInput,
  context?: CommandContext,
): Promise<UpdateAgentCommandOutput> {
  const { agentId, userId, ...updateData } = input;
  const agent = await agentConfigService
    .scoped(clients)
    .update(agentId, updateData);

  if (context?.eventEmitter) {
    if (updateData.isActive === true) {
      context.eventEmitter.emitAgentActivated(
        { agentId: agent.id, activatedBy: userId },
        userId,
      );
    } else if (updateData.isActive === false) {
      context.eventEmitter.emitAgentDeactivated(
        { agentId: agent.id, deactivatedBy: userId },
        userId,
      );
    } else {
      context.eventEmitter.emitAgentUpdated(
        {
          agentId: agent.id,
          updatedBy: userId,
          config: updateData.config,
        },
        userId,
      );
    }
  }

  return { agent };
}

export interface LinkLlmCommandInput {
  agentId: string;
  userId: string;
  llmId: string;
  secretName?: string;
  secretValue?: string;
  isDefault?: boolean;
}

export interface LinkLlmCommandOutput {
  link: unknown;
}

export async function linkLlm(
  clients: ServiceClients,
  input: LinkLlmCommandInput,
  context?: CommandContext,
): Promise<LinkLlmCommandOutput> {
  const { agentId, ...payload } = input;
  const link = await agentConfigService
    .scoped(clients)
    .linkLlm(agentId, payload as LinkLlmPayload);
  return { link };
}

export interface UnlinkLlmCommandInput {
  agentId: string;
  llmId: string;
}

export interface UnlinkLlmCommandOutput {
  success: boolean;
}

export async function unlinkLlm(
  clients: ServiceClients,
  input: UnlinkLlmCommandInput,
  context?: CommandContext,
): Promise<UnlinkLlmCommandOutput> {
  await agentConfigService
    .scoped(clients)
    .unlinkLlm(input.agentId, input.llmId);
  return { success: true };
}

export interface LinkMcpCommandInput {
  agentId: string;
  mcpId: string;
  secretName?: string;
  secretValue?: string;
}

export interface LinkMcpCommandOutput {
  link: unknown;
}

export async function linkMcp(
  clients: ServiceClients,
  input: LinkMcpCommandInput,
  context?: CommandContext,
): Promise<LinkMcpCommandOutput> {
  const { agentId, ...payload } = input;
  const link = await agentConfigService
    .scoped(clients)
    .linkMcp(agentId, payload as LinkMcpPayload);
  return { link };
}

export interface UnlinkMcpCommandInput {
  agentId: string;
  mcpId: string;
}

export interface UnlinkMcpCommandOutput {
  success: boolean;
}

export async function unlinkMcp(
  clients: ServiceClients,
  input: UnlinkMcpCommandInput,
  context?: CommandContext,
): Promise<UnlinkMcpCommandOutput> {
  await agentConfigService
    .scoped(clients)
    .unlinkMcp(input.agentId, input.mcpId);
  return { success: true };
}

export interface LinkSkillCommandInput {
  agentId: string;
  userId: string;
  skillId: string;
}

export interface LinkSkillCommandOutput {
  link: unknown;
}

export async function linkSkill(
  clients: ServiceClients,
  input: LinkSkillCommandInput,
  context?: CommandContext,
): Promise<LinkSkillCommandOutput> {
  const { agentId, userId, skillId } = input;
  const link = await agentConfigService
    .scoped(clients)
    .linkSkill(agentId, { skillId });

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillLinked(
      {
        agentId: agentId,
        skillId: skillId,
        linkedBy: userId,
      },
      userId,
    );
  }

  return { link };
}

export interface UnlinkSkillCommandInput {
  agentId: string;
  userId: string;
  skillId: string;
}

export interface UnlinkSkillCommandOutput {
  success: boolean;
}

export async function unlinkSkill(
  clients: ServiceClients,
  input: UnlinkSkillCommandInput,
  context?: CommandContext,
): Promise<UnlinkSkillCommandOutput> {
  const { agentId, userId, skillId } = input;
  await agentConfigService.scoped(clients).unlinkSkill(agentId, skillId);

  if (context?.eventEmitter) {
    context.eventEmitter.emitSkillUnlinked(
      {
        agentId: agentId,
        skillId: skillId,
        unlinkedBy: userId,
      },
      userId,
    );
  }

  return { success: true };
}
