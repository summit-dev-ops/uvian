import {
  ServiceClients,
  CreateMcpPayload,
  McpRecord,
} from '../../services/mcp/types';
import { createMcpService } from '../../services/mcp';
import type { CommandContext } from '../types';
import { getUserIdFromClient, getAccountIdFromUserId } from '../account-utils';

const mcpService = createMcpService({});

export interface CreateMcpCommandInput extends CreateMcpPayload {}

export interface CreateMcpCommandOutput {
  mcp: McpRecord;
}

export async function createMcp(
  clients: ServiceClients,
  input: CreateMcpCommandInput,
  context?: CommandContext,
): Promise<CreateMcpCommandOutput> {
  const userId = await getUserIdFromClient(clients);
  const accountId = await getAccountIdFromUserId(clients, userId);

  const mcp = await mcpService.scoped(clients).create(accountId, input);
  return { mcp };
}

export interface UpdateMcpCommandInput {
  mcpId: string;
  name?: string;
  type?: string;
  url?: string;
  authMethod?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateMcpCommandOutput {
  mcp: McpRecord;
}

export async function updateMcp(
  clients: ServiceClients,
  input: UpdateMcpCommandInput,
  context?: CommandContext,
): Promise<UpdateMcpCommandOutput> {
  const { mcpId, ...updateData } = input;
  const mcp = await mcpService.scoped(clients).update(mcpId, updateData);
  return { mcp };
}

export interface DeleteMcpCommandInput {
  mcpId: string;
}

export interface DeleteMcpCommandOutput {
  success: boolean;
}

export async function deleteMcp(
  clients: ServiceClients,
  input: DeleteMcpCommandInput,
  context?: CommandContext,
): Promise<DeleteMcpCommandOutput> {
  await mcpService.scoped(clients).delete(input.mcpId);
  return { success: true };
}